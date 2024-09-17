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

    <v-container v-if="posts.length > 0 && !isNSFWDialogOpen" fluid>
      <v-row align="center" justify="center">
        <v-btn @click="startSlideshow(0)">Start slideshow</v-btn>
      </v-row>
    </v-container>

    <ImageGrid
      :agreed-to-n-s-f-w="agreedToNSFW"
      :posts="posts"
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
  const isPlaying = ref(false)
  const after = ref(null)
  const bottomRef = ref(null)
  const imageOverlay = ref(false)

  const slideshowIntervalTime = 5000 // 5 seconds per image
  let slideshowInterval = null

  const fetchRedditImages = async (reset = false) => {
    if (!subreddit.value) return

    if (reset) {
      posts.value = []
      after.value = null
      currentIndex.value = 0
    }

    try {
      const url = `https://www.reddit.com/r/${subreddit.value}/${sortOption.value}.json?limit=50${after.value ? `&after=${after.value}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      const filteredPosts = data.data.children.filter(item => item.data.post_hint === 'image' && !item.data.is_self)

      posts.value = reset ? filteredPosts : [...posts.value, ...filteredPosts]
      after.value = data.data.after

      if (agreedToNSFW.value !== 'true' && posts.value.some(post => post.data.over_18)) {
        isNSFWDialogOpen.value = true
      }
    } catch (error) {
      console.error('Error fetching data from Reddit:', error)
    }
  }

  const startSlideshow = (startingIndex = currentIndex.value) => {
    if (isPlaying.value) return
    isPlaying.value = true
    setOverlayImage(startingIndex)
    slideshowInterval = setInterval(nextImage, slideshowIntervalTime)
  }

  const setOverlayImage = index => {
    imageOverlay.value = true
    currentIndex.value = index
  }

  const stopSlideshow = () => {
    if (!isPlaying.value) return

    clearInterval(slideshowInterval)
    isPlaying.value = false
  }

  const toggleSlideshow = () => isPlaying.value ? stopSlideshow() : startSlideshow()

  const nextImage = () => {
    if (currentIndex.value >= visiblePosts.value.length - 4) {
      fetchRedditImages()
    }
    currentIndex.value = (currentIndex.value + 1) % visiblePosts.value.length
  }

  const prevImage = () => {
    currentIndex.value = (currentIndex.value - 1 + visiblePosts.value.length) % visiblePosts.value.length
  }

  const goToLink = () => {
    window.open(`https://reddit.com${visiblePosts.value[currentIndex.value].data.permalink}`, '_blank')
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

  const currentPostUrl = computed(() => visiblePosts.value[currentIndex.value]?.data.url)
  const hasPrevious = computed(() => currentIndex.value > 0)
  const hasNext = computed(() => currentIndex.value < posts.value.length - 1)

  const visiblePosts = computed(() => {
    return agreedToNSFW.value ? posts.value : posts.value.filter(post => !post.data.over_18)
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
    if (newValue >= visiblePosts.value.length - 4) {
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
