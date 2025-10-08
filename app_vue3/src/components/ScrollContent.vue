<template>
  <v-container align-content="start" fluid>

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
    />

    <ImageOverlay
      v-model:imageOverlay="imageOverlay"
      :current-post-url="currentPostUrl"
      :has-next="hasNext"
      :has-previous="hasPrevious"
      :is-playing="isPlaying"
      @go-to-link="goToLink"
      @next-image="nextImage"
      @prev-image="prevImage"
      @skip-post="skipPost"
      @stop-slideshow="stopSlideshow"
      @toggle-slideshow="toggleSlideshow"
    />

    <div ref="bottomRef" />
  </v-container>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

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
  const bottomRef = ref(null)
  const imageOverlay = ref(false)
  const fetchingImages = ref(false)
  const infoBannerVisible = ref(true)

  const slideshowIntervalTime = 5000 // 5 seconds per image
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
          if (data.is_gallery) {
            const images = Object.keys(data.media_metadata).map(id => {
              const media = data.media_metadata[id]
              // Find the best quality image that is not a gif
              const bestQuality = media.p.find(q => q.x > 1000) || media.s
              return bestQuality.u.replace(/&amp;/g, '&')
            })
            return { postData: data, images, isAlbum: true }
          }
          if (data.post_hint === 'image' && !data.is_self) {
            return { postData: data, images: [data.url], isAlbum: false }
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
    slideshowInterval = setInterval(slideshowNext, slideshowIntervalTime)
  }

  const setOverlayImage = index => {
    imageOverlay.value = true
    currentIndex.value = index
    currentImageIndex.value = 0
  }

  const stopSlideshow = () => {
    if (!isPlaying.value) return

    clearInterval(slideshowInterval)
    isPlaying.value = false
  }

  const toggleSlideshow = () => isPlaying.value ? stopSlideshow() : startSlideshow()

  const slideshowNext = () => {
    const currentPost = visiblePosts.value[currentIndex.value]
    if (currentPost.isAlbum && currentImageIndex.value < currentPost.images.length - 1) {
      currentImageIndex.value++
    } else {
      nextImage()
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

  const currentPostUrl = computed(() => {
    const post = visiblePosts.value[currentIndex.value]
    return post?.images[currentImageIndex.value]
  })

  const hasPrevious = computed(() => currentIndex.value > 0 || currentImageIndex.value > 0)
  const hasNext = computed(() => {
    if (visiblePosts.value.length === 0) return false
    const lastPostIndex = visiblePosts.value.length - 1
    const currentPost = visiblePosts.value[currentIndex.value]
    return currentIndex.value < lastPostIndex || (currentPost && currentImageIndex.value < currentPost.images.length - 1)
  })

  const visiblePosts = computed(() => {
    return agreedToNSFW.value ? posts.value : posts.value.filter(post => !post.postData.over_18)
  })

  watch(bottomRef, newVal => {
    if (newVal) {
      const observer = new IntersectionObserver(
        entries => {
          if (visiblePosts.value.length > 0 && entries[0].isIntersecting) {
            fetchRedditImages()
          }
        },
        { rootMargin: '0px', threshold: 1.0 }
      )
      observer.observe(bottomRef.value)
    }
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
