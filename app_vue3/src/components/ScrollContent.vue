<template>
  <v-container align-content="start" fluid>
    <v-row>
      <v-col cols="12" md="12">
        <v-text-field
          v-model="subreddit"
          clearable
          hint="Press enter to search"
          label="Enter Subreddit Name"
          @keyup.enter="fetchRedditImages(true)"
        >
          <template #append-inner>
            <v-btn icon title="Reset" @click="resetSearch">
              <v-icon>mdi-restore</v-icon>
            </v-btn>
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" icon title="Sort By">
                  <v-icon>mdi-wrench</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="item in sortOptions"
                  :key="item"
                  :value="item"
                  @click="sortOption = item"
                >
                  <v-list-item-title>
                    {{ item }}
                    <v-icon v-if="item === sortOption">mdi-check</v-icon>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-btn color="secondary" icon title="Search" @click="fetchRedditImages(true)">
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-col>
    </v-row>

    <v-row cols="3">
      <v-alert
        v-model="isNSFWDialogOpen"
        dense
        icon="mdi-alert-octagon"
        prominent
        text
        type="warning"
      >
        <v-row align="center">
          <v-col class="grow">Your search returned some NSFW (Not Safe For Work) content. Would you like to see this content?</v-col>
        </v-row>
        <template #append>
          <v-btn icon small @click="closeNSFWDialog">
            <v-icon>mdi-cancel</v-icon>
          </v-btn>
          <v-btn icon small @click="acceptNSFW">
            <v-icon>mdi-check</v-icon>
          </v-btn>
        </template>
      </v-alert>
    </v-row>

    <v-container v-if="posts.length > 0" fluid>
      <v-row align="center" justify="center">
        <v-btn @click="startSlideshow(0)">Start slideshow</v-btn>
      </v-row>
    </v-container>

    <v-container fluid>
      <v-row>
        <v-col v-for="(post, index) in visiblePosts" :key="post.data.id" cols="12" md="4">
          <v-card>
            <v-img :aspect-ratio="1" :src="post.data.url" @click="setOverlayImage(index)" />
            <v-card-title>{{ post.data.title }}</v-card-title>
            <v-card-actions>
              <v-btn color="primary" :href="post.data.url" target="_blank" text>View Image On Reddit</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="imageOverlay" max-height="100vh" max-width="100vw" @keydown.esc="stopSlideshow">
      <v-card class="full-size-card">
        <v-card-text class="full-size-card-text">
          <v-progress-circular
            v-if="imageLoading"
            class="loader"
            color="primary"
            indeterminate
            size="64"
          />
          <v-img
            :key="currentPostUrl"
            class="full-size-image"
            :src="currentPostUrl"
            @load="imageLoading = false"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="goToLink">View post on Reddit</v-btn>
          <v-btn :disabled="!hasPrevious" @click="prevImage">Previous</v-btn>
          <v-btn :disabled="!hasNext" @click="nextImage">Next</v-btn>
          <v-btn @click="toggleSlideshow">{{ isPlaying ? 'Pause Slideshow' : 'Start Slideshow' }}</v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  const imageLoading = ref(true)

  const sortOptions = ['hot', 'new', 'top']

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
    slideshowInterval = setInterval(nextImage, 4000)
  }

  const setOverlayImage = index => {
    imageOverlay.value = true
    imageLoading.value = true
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

  const closeNSFWDialog = () => {
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

  // onMounted(() => fetchRedditImages(true))

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
