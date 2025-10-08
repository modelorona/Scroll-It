import { defineStore } from 'pinia';
import { useSettingsStore } from './settings';

export const useGalleryStore = defineStore('gallery', {
  state: () => ({
    posts: [],
    subreddit: '',
    sortOption: 'hot',
    after: null,
    fetchingImages: false,
    isNSFWDialogOpen: false,
    agreedToNSFW: sessionStorage.getItem('agreedToNSFW') === 'true',
    currentIndex: 0,
    currentImageIndex: 0,
    isPlaying: false,
    imageOverlay: false,
    infoBannerVisible: true,
    error: null,
    slideshowInterval: null,
  }),
  getters: {
    slideshowIntervalTimeMs: (state) => {
      const settingsStore = useSettingsStore();
      return settingsStore.slideshowInterval * 1000;
    },
    visiblePosts: (state) => {
      return state.agreedToNSFW ? state.posts : state.posts.filter(post => !post.postData.over_18);
    },
    currentPost: (state) => {
      return state.visiblePosts[state.currentIndex];
    },
    hasPrevious: (state) => {
      return state.currentIndex > 0 || state.currentImageIndex > 0;
    },
    hasNext: (state) => {
      if (state.visiblePosts.length === 0) return false;
      const lastPostIndex = state.visiblePosts.length - 1;
      const post = state.visiblePosts[state.currentIndex];
      return state.currentIndex < lastPostIndex || (post && state.currentImageIndex < post.images.length - 1);
    },
  },
  actions: {
    async fetchRedditImages(reset = false) {
      if (!this.subreddit) return;

      if (reset) {
        this.posts = [];
        this.after = null;
        this.currentIndex = 0;
        this.currentImageIndex = 0;
      }
      this.fetchingImages = true;
      this.error = null;
      try {
        const url = `https://www.reddit.com/r/${this.subreddit}/${this.sortOption}.json?limit=50${this.after ? `&after=${this.after}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Subreddit r/${this.subreddit} not found.`);
        }
        const data = await response.json();
        const processedPosts = data.data.children
          .map(post => {
            const { data } = post
            // Album / Gallery
            if (data.is_gallery) {
              const images = Object.keys(data.media_metadata).map(id => {
                const media = data.media_metadata[id]
                const bestQuality = media.p.find(q => q.x > 1000) || media.s
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
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching data from Reddit:', error);
      } finally {
        this.fetchingImages = false;
      }
    },
    startSlideshow(startingIndex = this.currentIndex) {
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.setOverlayImage(startingIndex);

      const post = this.visiblePosts[this.currentIndex];
      if (post.mediaType !== 'video') {
        this.slideshowInterval = setInterval(this.slideshowNext, this.slideshowIntervalTimeMs);
      }
    },
    setOverlayImage(index) {
      this.imageOverlay = true;
      this.currentIndex = index;
      this.currentImageIndex = 0;
    },
    stopSlideshow() {
      if (!this.isPlaying) return;
      clearInterval(this.slideshowInterval);
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
      if (this.currentIndex >= this.visiblePosts.length - 4) {
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
        clearInterval(this.slideshowInterval);
        const nextPost = this.visiblePosts[this.currentIndex];
        if (nextPost.mediaType !== 'video') {
          this.slideshowInterval = setInterval(this.slideshowNext, this.slideshowIntervalTimeMs);
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
      this.after = '';
    },
    acceptNSFW() {
      this.isNSFWDialogOpen = false;
      sessionStorage.setItem('agreedToNSFW', 'true');
      this.agreedToNSFW = true;
    },
    declineNSFW() {
      sessionStorage.setItem('agreedToNSFW', 'false');
      this.agreedToNSFW = false;
      this.isNSFWDialogOpen = false;
    },
  },
});
