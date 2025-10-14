/*
 * Copyright 2025 Clidey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {defineStore} from 'pinia';
import {useSettingsStore} from './settings';

const PROXY_URL = 'https://europe-west4-scrollit-f3849.cloudfunctions.net/redditProxy';
const SEARCH_PROXY_URL = 'https://europe-west4-scrollit-f3849.cloudfunctions.net/searchSubredditsProxy';
const PROXY_STATUS_URL = 'https://europe-west4-scrollit-f3849.cloudfunctions.net/proxyStatus';

// Set this to your localhost secret for local testing (optional)
// In production, leave as empty string
const LOCALHOST_SECRET = import.meta.env.VITE_LOCALHOST_SECRET || '';

/**
 * Get fetch options with localhost secret header if needed
 * @param url - The URL being fetched to determine if header is needed
 */
function getFetchOptions(url: string): RequestInit {
  const options: RequestInit = {};

  // Only add the header if:
  // 1. We're on localhost
  // 2. Have a secret configured
  // 3. Making a request to our proxy endpoints (not Reddit directly)
  const isProxyRequest = url.includes('scrollit-f3849.cloudfunctions.net');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (LOCALHOST_SECRET && isLocalhost && isProxyRequest) {
    options.headers = {
      'X-Localhost-Secret': LOCALHOST_SECRET
    };
  }

  return options;
}

interface PostData {
  over_18: boolean;
  permalink: string;
  [key: string]: any;
}

interface Post {
  postData: PostData;
  images: string[];
  isAlbum: boolean;
  mediaType: 'album' | 'image' | 'video' | 'embed';
}

interface GalleryState {
  posts: Post[];
  subreddit: string;
  sortOption: string;
  after: string | null;
  fetchingImages: boolean;
  isNSFWDialogOpen: boolean;
  agreedToNSFW: boolean;
  currentIndex: number;
  currentImageIndex: number;
  isPlaying: boolean;
  imageOverlay: boolean;
  infoBannerVisible: boolean;
  isProxyPromptOpen: boolean;
  proxyStatus: 'checking' | 'operational' | 'degraded' | 'unavailable';
  proxyStatusDetails: {
    firestore: string;
    reddit: string;
  } | null;
  error: string | null;
  slideshowInterval: number | null;
}

export const useGalleryStore = defineStore('gallery', {
  state: (): GalleryState => {
    const settingsStore = useSettingsStore();
    return {
      posts: [],
      subreddit: '',
      sortOption: settingsStore.sortOption,
      after: null,
      fetchingImages: false,
      isNSFWDialogOpen: false,
      agreedToNSFW: settingsStore.agreedToNSFW,
      currentIndex: 0,
      currentImageIndex: 0,
      isPlaying: false,
      imageOverlay: false,
      infoBannerVisible: true,
      isProxyPromptOpen: false,
      proxyStatus: 'checking',
      proxyStatusDetails: null,
      error: null,
      slideshowInterval: null,
    };
  },
  getters: {
    slideshowIntervalTimeMs: () => {
      const settingsStore = useSettingsStore();
      return settingsStore.slideshowInterval * 1000;
    },
    visiblePosts: (state) => {
      return state.agreedToNSFW ? state.posts : state.posts.filter(post => !post.postData.over_18);
    },
    currentPost(): Post | undefined {
      return this.visiblePosts[this.currentIndex];
    },
    hasPrevious: (state) => {
      return state.currentIndex > 0 || state.currentImageIndex > 0;
    },
    hasNext(): boolean {
      if (this.visiblePosts.length === 0) return false;
      const lastPostIndex = this.visiblePosts.length - 1;
      const post = this.visiblePosts[this.currentIndex];
      return this.currentIndex < lastPostIndex || (post && this.currentImageIndex < post.images.length - 1);
    },
  },
  actions: {
    async fetchRedditImages(reset = false) {
      if (!this.subreddit) return;

      // Prevent concurrent fetches
      if (this.fetchingImages && !reset) {
        return;
      }

      const settingsStore = useSettingsStore();
      settingsStore.setSortOption(this.sortOption);

      if (reset) {
        this.posts = [];
        this.after = null;
        this.currentIndex = 0;
        this.currentImageIndex = 0;
      }
      this.fetchingImages = true;
      this.error = null;
      try {
        let url;
        if (settingsStore.useProxy) {
          const params = new URLSearchParams({
            subreddit: this.subreddit,
            sort: this.sortOption,
            limit: '100',
          });
          if (this.after) {
            params.append('after', this.after);
          }
          url = `${PROXY_URL}?${params.toString()}`;
        } else {
          url = `https://www.reddit.com/r/${this.subreddit}/${this.sortOption}.json?limit=100${this.after ? `&after=${this.after}` : ''}`;
        }
        const response = await fetch(url, getFetchOptions(url));
        if (!response.ok) {
          throw new Error(`Subreddit r/${this.subreddit} not found.`);
        }
        const data = await response.json();

        // Check if Reddit returned an empty result (likely blocked/restricted)
        if (reset && data.data.children.length === 0) {
          console.log('Reddit returned empty results for subreddit:', this.subreddit);
          throw new Error(`Could not load content from r/${this.subreddit}. This may be due to network restrictions.`);
        }

        const processedPosts = data.data.children
          .map((post: any) => {
            const { data } = post
            // Album / Gallery
            if (data.is_gallery) {
              const images = Object.keys(data.media_metadata).map(id => {
                const media = data.media_metadata[id]
                const bestQuality = media.p.find((q: any) => q.x > 1000) || media.s
                return bestQuality.u.replace(/&amp;/g, '&')
              })
              return { postData: data, images, isAlbum: true, mediaType: 'album' }
            }
            // Standard Image
            if (data.post_hint === 'image' && !data.is_self) {
              return { postData: data, images: [data.url], isAlbum: false, mediaType: 'image' }
            }
            // Reddit-hosted Video
            if (data.is_video && data.post_hint === 'hosted:video') {
              const videoUrl = data.secure_media?.reddit_video?.fallback_url
              if (videoUrl) {
                return { postData: data, images: [videoUrl], isAlbum: false, mediaType: 'video' }
              }
            }
            // Embeds (YouTube, etc.) and direct GIFs (Gfycat, Imgur)
            if (data.post_hint === 'rich:video') {
              // Direct GIF/MP4
              if (data.domain === 'gfycat.com' || data.domain === 'i.imgur.com') {
                const videoUrl = data.preview?.images[0]?.variants?.mp4?.source?.url
                if (videoUrl) {
                  return { postData: data, images: [videoUrl.replace(/&amp;/g, '&')], isAlbum: false, mediaType: 'video' }
                }
              }
              // Embedded Player
              if (data.secure_media?.oembed?.html) {
                const html = data.secure_media.oembed.html.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                return { postData: data, images: [html], isAlbum: false, mediaType: 'embed' }
              }
            }
            return null
          })
          .filter(Boolean);

        this.posts = reset ? processedPosts : [...this.posts, ...processedPosts];
        this.after = data.data.after;

        if (!this.agreedToNSFW && this.posts.some(p => p.postData.over_18)) {
          this.isNSFWDialogOpen = true;
        }
      } catch (error: any) {
        this.error = error.message;
        console.error('Error fetching data from Reddit:', error);
        console.log('useProxy:', settingsStore.useProxy);
        console.log('isProxyPromptOpen before:', this.isProxyPromptOpen);
        if (!settingsStore.useProxy) {
          this.isProxyPromptOpen = true;
          console.log('Setting isProxyPromptOpen to true');
        } else {
          console.log('Proxy already enabled, not showing prompt');
        }
        console.log('isProxyPromptOpen after:', this.isProxyPromptOpen);
      } finally {
        this.fetchingImages = false;
      }
    },
    enableProxyAndRetry() {
      const settingsStore = useSettingsStore();
      settingsStore.setUseProxy(true);
      this.isProxyPromptOpen = false;
      this.fetchRedditImages(true);
    },
    declineProxy() {
      this.isProxyPromptOpen = false;
    },
    async checkProxyStatus() {
      this.proxyStatus = 'checking';
      this.proxyStatusDetails = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(PROXY_STATUS_URL, {
          ...getFetchOptions(PROXY_STATUS_URL),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          this.proxyStatus = data.status;
          this.proxyStatusDetails = {
            firestore: data.services.firestore,
            reddit: data.services.reddit,
          };
        } else {
          this.proxyStatus = 'unavailable';
        }
      } catch (error) {
        console.error('Error checking proxy status:', error);
        this.proxyStatus = 'unavailable';
      }
    },
    startSlideshow(startingIndex?: number) {
      if (startingIndex === undefined) {
        startingIndex = this.currentIndex;
      }
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.setOverlayImage(startingIndex);

      const post = this.visiblePosts[this.currentIndex];
      if (post.mediaType !== 'video') {
        this.slideshowInterval = window.setInterval(this.slideshowNext, this.slideshowIntervalTimeMs);
      }
    },
    setOverlayImage(index: number) {
      this.imageOverlay = true;
      this.currentIndex = index;
      this.currentImageIndex = 0;
    },
    stopSlideshow() {
      if (!this.isPlaying) return;
      if (this.slideshowInterval !== null) {
        window.clearInterval(this.slideshowInterval);
      }
      this.slideshowInterval = null;
      this.isPlaying = false;
    },
    toggleSlideshow() {
      this.isPlaying ? this.stopSlideshow() : this.startSlideshow();
    },
    slideshowNext() {
      const currentPost = this.visiblePosts[this.currentIndex];
      if (currentPost.mediaType === 'album' && this.currentImageIndex < currentPost.images.length - 1) {
        this.currentImageIndex++;
      } else {
        this.nextImage();
      }
    },
    handleMediaEnded() {
      if (this.isPlaying) {
        this.slideshowNext();
      }
    },
    nextImage() {
      // Only fetch more if we have posts and are near the end
      if (this.visiblePosts.length > 0 &&
        this.currentIndex >= this.visiblePosts.length - 10 &&
        !this.fetchingImages &&
        !this.error) {
        this.fetchRedditImages();
      }
      const currentPost = this.visiblePosts[this.currentIndex];
      if (currentPost.isAlbum && this.currentImageIndex < currentPost.images.length - 1) {
        this.currentImageIndex++;
      } else if (this.currentIndex < this.visiblePosts.length - 1) {
        this.currentIndex++;
        this.currentImageIndex = 0;
      }

      if (this.isPlaying) {
        if (this.slideshowInterval !== null) {
          window.clearInterval(this.slideshowInterval);
        }
        const nextPost = this.visiblePosts[this.currentIndex];
        if (nextPost.mediaType !== 'video') {
          this.slideshowInterval = window.setInterval(this.slideshowNext, this.slideshowIntervalTimeMs);
        }
      }
    },
    prevImage() {
      const currentPost = this.visiblePosts[this.currentIndex];
      if (currentPost.isAlbum && this.currentImageIndex > 0) {
        this.currentImageIndex--;
      } else if (this.currentIndex > 0) {
        this.currentIndex--;
        const prevPost = this.visiblePosts[this.currentIndex];
        this.currentImageIndex = prevPost.isAlbum ? prevPost.images.length - 1 : 0;
      }
    },
    skipPost() {
      if (this.currentIndex < this.visiblePosts.length - 1) {
        this.currentIndex++;
        this.currentImageIndex = 0;
      }
    },
    goToLink() {
      window.open(`https://reddit.com${this.visiblePosts[this.currentIndex].postData.permalink}`, '_blank');
    },
    resetSearch() {
      this.posts = [];
      this.subreddit = '';
      this.after = null;
    },
    acceptNSFW() {
      this.isNSFWDialogOpen = false;
      const settingsStore = useSettingsStore();
      settingsStore.setAgreedToNSFW(true);
      this.agreedToNSFW = true;
    },
    declineNSFW() {
      const settingsStore = useSettingsStore();
      settingsStore.setAgreedToNSFW(false);
      this.agreedToNSFW = false;
      this.isNSFWDialogOpen = false;
    },
    async searchSubreddits(query: string) {
      if (!query) {
        return [];
      }
      try {
        const settingsStore = useSettingsStore();
        let url;
        if (settingsStore.useProxy) {
          url = `${SEARCH_PROXY_URL}?query=${encodeURIComponent(query)}`;
        } else {
          url = `https://www.reddit.com/api/search_reddit_names.json?query=${encodeURIComponent(query)}&include_over_18=true`;
        }
        const response = await fetch(url, getFetchOptions(url));
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.names || [];
      } catch (error) {
        console.error('Error fetching subreddit suggestions:', error);
        return [];
      }
    }
  },
});
