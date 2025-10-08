<template>
  <v-container align-content="start" fluid class="px-md-4">

    <SearchBar
      v-model:sortOption="sortOption"
      v-model:subreddit="subreddit"
      @reset="resetSearch"
      @search="fetchRedditImages(true)"
    />

    <NSFWAlert
      v-model:isOpen="isNSFWDialogOpen"
      @accept="acceptNSFW"
      @decline="declineNSFW"
    />

    <v-container v-if="infoBannerVisible && visiblePosts.length > 0 && !isNSFWDialogOpen" fluid>
      <v-row align="center" justify="center">
        <v-banner
          icon="mdi-information"
          lines="one"
          rounded
          :stacked="false"
          text="Click on an image to enlarge it"
        >
          <template #actions>
            <v-btn icon="mdi-close" @click="infoBannerVisible = false" />
          </template>
        </v-banner>
      </v-row>
    </v-container>

    <v-container v-if="visiblePosts.length > 0 && !isNSFWDialogOpen" fluid>
      <v-row align="center" justify="center">
        <v-btn @click="startSlideshow(0)">Start slideshow</v-btn>
      </v-row>
    </v-container>

    <ImageGrid
      :agreed-to-n-s-f-w="agreedToNSFW"
      :fetching-images="fetchingImages"
      :posts="visiblePosts"
      @select-image="setOverlayImage"
      @load-more="fetchRedditImages"
    />

    <MediaOverlay
      v-model="imageOverlay"
      :current-post="currentPost"
      :current-image-index="currentImageIndex"
      :has-next="hasNext"
      :has-previous="hasPrevious"
      :is-playing="isPlaying"
      @go-to-link="goToLink"
      @next-image="nextImage"
      @prev-image="prevImage"
      @skip-post="skipPost"
      @stop-slideshow="stopSlideshow"
      @toggle-slideshow="toggleSlideshow"
      @media-ended="handleMediaEnded"
    />
  </v-container>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useSettingsStore } from '@/stores/settings'
  import MediaOverlay from './MediaOverlay.vue'

  const settingsStore = useSettingsStore()
  const route = useRoute()
  const subreddit = ref(route.params.subreddit || '')
  const sortOption = ref(route.query.type || 'hot')
  const posts = ref([])
  const isNSFWDialogOpen = ref(false)
  const agreedToNSFW = ref(sessionStorage.getItem('agreedToNSFW') === 'true')
  const currentIndex = ref(0)
  const currentImageIndex = ref(0)
  const isPlaying = ref(false)
  const after = ref(null)
  const imageOverlay = ref(false)
  const fetchingImages = ref(false)
  const infoBannerVisible = ref(true)

  const slideshowIntervalTimeMs = computed(() => settingsStore.slideshowInterval * 1000)
  let slideshowInterval = null

  const fetchRedditImages = async (reset = false) => {
    if (!subreddit.value) return

    if (reset) {
      posts.value = []
      after.value = null
      currentIndex.value = 0
      currentImageIndex.value = 0
    }
    fetchingImages.value = true
    try {
      const url = `https://www.reddit.com/r/${subreddit.value}/${sortOption.value}.json?limit=50${after.value ? `&after=${after.value}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
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
        .filter(Boolean)

      posts.value = reset ? processedPosts : [...posts.value, ...processedPosts]
      after.value = data.data.after

      if (!agreedToNSFW.value && posts.value.some(p => p.postData.over_18)) {
        isNSFWDialogOpen.value = true
      }
      fetchingImages.value = false
    } catch (error) {
      console.error('Error fetching data from Reddit:', error)
    }
  }

  const startSlideshow = (startingIndex = currentIndex.value) => {
    if (isPlaying.value) return
    isPlaying.value = true
    setOverlayImage(startingIndex)
    
    const post = visiblePosts.value[currentIndex.value]
    // Only start the timer for non-video posts
    if (post.mediaType !== 'video') {
      slideshowInterval = setInterval(slideshowNext, slideshowIntervalTimeMs.value)
    }
  }

  const setOverlayImage = index => {
    imageOverlay.value = true
    currentIndex.value = index
    currentImageIndex.value = 0
  }

  const stopSlideshow = () => {
    if (!isPlaying.value) return
    clearInterval(slideshowInterval)
    slideshowInterval = null
    isPlaying.value = false
  }

  const toggleSlideshow = () => isPlaying.value ? stopSlideshow() : startSlideshow()

  const slideshowNext = () => {
    const currentPost = visiblePosts.value[currentIndex.value]
    if (currentPost.mediaType === 'album' && currentImageIndex.value < currentPost.images.length - 1) {
      currentImageIndex.value++
    } else {
      nextImage()
    }
  }
  
  const handleMediaEnded = () => {
    if (isPlaying.value) {
      slideshowNext()
    }
  }

  const nextImage = () => {
    if (currentIndex.value >= visiblePosts.value.length - 4) {
      fetchRedditImages()
    }
    const currentPost = visiblePosts.value[currentIndex.value]
    if (currentPost.isAlbum && currentImageIndex.value < currentPost.images.length - 1) {
      currentImageIndex.value++
    } else if (currentIndex.value < visiblePosts.value.length - 1) {
      currentIndex.value++
      currentImageIndex.value = 0
    }
    
    // If slideshow is active, reset the interval for the next item
    if (isPlaying.value) {
      clearInterval(slideshowInterval)
      const nextPost = visiblePosts.value[currentIndex.value]
      if (nextPost.mediaType !== 'video') {
        slideshowInterval = setInterval(slideshowNext, slideshowIntervalTimeMs.value)
      }
    }
  }

  const prevImage = () => {
    const currentPost = visiblePosts.value[currentIndex.value]
    if (currentPost.isAlbum && currentImageIndex.value > 0) {
      currentImageIndex.value--
    } else if (currentIndex.value > 0) {
      currentIndex.value--
      const prevPost = visiblePosts.value[currentIndex.value]
      currentImageIndex.value = prevPost.isAlbum ? prevPost.images.length - 1 : 0
    }
  }

  const skipPost = () => {
    if (currentIndex.value < visiblePosts.value.length - 1) {
      currentIndex.value++
      currentImageIndex.value = 0
    }
  }

  const goToLink = () => {
    window.open(`https://reddit.com${visiblePosts.value[currentIndex.value].postData.permalink}`, '_blank')
  }

  const resetSearch = () => {
    posts.value = []
    subreddit.value = ''
    after.value = ''
  }

  const acceptNSFW = () => {
    isNSFWDialogOpen.value = false
    sessionStorage.setItem('agreedToNSFW', 'true')
    agreedToNSFW.value = true
  }

  const declineNSFW = () => {
    sessionStorage.setItem('agreedToNSFW', 'false')
    agreedToNSFW.value = false
    isNSFWDialogOpen.value = false
  }

  const currentPost = computed(() => visiblePosts.value[currentIndex.value])

  const hasPrevious = computed(() => currentIndex.value > 0 || currentImageIndex.value > 0)
  const hasNext = computed(() => {
    if (visiblePosts.value.length === 0) return false
    const lastPostIndex = visiblePosts.value.length - 1
    const post = visiblePosts.value[currentIndex.value]
    return currentIndex.value < lastPostIndex || (post && currentImageIndex.value < post.images.length - 1)
  })

  const visiblePosts = computed(() => {
    return agreedToNSFW.value ? posts.value : posts.value.filter(post => !post.postData.over_18)
  })

  

  watch(currentIndex, newValue => {
    if (newValue >= visiblePosts.value.length - 6) {
      fetchRedditImages()
    }
  })
</script>

<style scoped>
.v-card {
  margin-bottom: 20px;
}
.v-img {
  max-width: 100%;
  height: auto;
}
.full-size-card {
  height: 100vh;
  width: 100vw;
}
.full-size-card-text {
  height: 94vh;
  width: 100vw;
}
.full-size-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
