<template>
  <v-container>

    <v-row>
      <v-col cols="6" md="10">
        <v-text-field
          v-model="subreddit"
          clearable
          label="Enter Subreddit"
          @keyup.enter="fetchRedditImages"
        />
      </v-col>
      <v-col cols="3" md="1">
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              v-model="sortOption"
              icon
              :items="sortOptions"
              label="Sort By"
            ><v-icon>mdi-wrench</v-icon></v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(item, index) in sortOptions"
              :key="index"
              :value="index"
              @click="sortOption = item"
            >
              <v-list-item-title v-if="item == sortOption">{{ item }} <v-icon>mdi-check</v-icon></v-list-item-title>
              <v-list-item-title v-else>{{ item }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
      <v-col cols="3" md="1">
        <v-btn color="primary" icon @click="fetchRedditImages"><v-icon>mdi-send</v-icon></v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="post in posts" :key="post.data.id" cols="12" md="4">
        <v-card @click="openSlideshow(post)">
          <v-img
            v-if="isImage(post.data.url)"
            height="200px"
            :src="post.data.url"
          >
            <v-card-title>{{ post.data.title }}</v-card-title>
          </v-img>
          <v-card-subtitle v-else>
            {{ post.data.title }}
          </v-card-subtitle>
          <v-card-actions>
            <v-btn color="primary" :href="post.data.permalink" target="_blank">View on Reddit</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="isNSFWDialogOpen" max-width="600px">
      <v-card>
        <v-card-title class="red">
          <span>NSFW Content Warning</span>
          <v-spacer />
          <v-btn icon @click="closeNSFWDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          This subreddit contains NSFW content. Would you like to proceed?
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="acceptNSFW">Accept</v-btn>
          <v-btn @click="closeNSFWDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isSlideshowOpen" max-width="600px">
      <v-card>
        <v-card-title>
          <span>{{ currentPostTitle }}</span>
          <v-spacer />
          <v-btn icon @click="closeSlideshow">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-img height="400px" :src="currentPostUrl" />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="goToLink">View on Reddit</v-btn>
          <v-spacer />
          <v-btn :disabled="!hasPrevious" @click="prevImage">Previous</v-btn>
          <v-btn :disabled="!hasNext" @click="nextImage">Next</v-btn>
          <v-btn @click="toggleSlideshow">{{ isPlaying ? 'Pause' : 'Play' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
  import { onMounted, ref } from 'vue'

  export default {
    name: 'RedditImageViewer',
    setup () {
      const subreddit = ref('')
      const sortOption = ref('hot')
      const posts = ref([])
      const isSlideshowOpen = ref(false)
      const isNSFWDialogOpen = ref(false)
      const currentIndex = ref(0)
      const isPlaying = ref(false)
      let slideshowInterval = null

      const sortOptions = ['hot', 'new', 'top']

      const fetchRedditImages = async () => {
        try {
          const response = await fetch(`https://www.reddit.com/r/${subreddit.value}/${sortOption.value}.json`)
          const data = await response.json()
          posts.value = data.data.children

          // Check for NSFW content
          const nsfwPost = posts.value.some(post => post.data.over_18)
          if (nsfwPost) {
            isNSFWDialogOpen.value = true
          }
        } catch (error) {
          console.error('Error fetching data from Reddit:', error)
        }
      }

      const isImage = url => {
        return url.endsWith('.jpg') || url.endsWith('.png')
      }

      const openSlideshow = post => {
        currentIndex.value = posts.value.indexOf(post)
        isSlideshowOpen.value = true
        startSlideshow()
      }

      const closeSlideshow = () => {
        isSlideshowOpen.value = false
        stopSlideshow()
      }

      const startSlideshow = () => {
        if (!isPlaying.value) {
          isPlaying.value = true
          slideshowInterval = setInterval(() => {
            nextImage()
          }, 3000) // Change image every 3 seconds
        }
      }

      const stopSlideshow = () => {
        if (isPlaying.value) {
          clearInterval(slideshowInterval)
          isPlaying.value = false
        }
      }

      const toggleSlideshow = () => {
        if (isPlaying.value) {
          stopSlideshow()
        } else {
          startSlideshow()
        }
      }

      const nextImage = () => {
        if (currentIndex.value < posts.value.length - 1) {
          currentIndex.value++
        } else {
          currentIndex.value = 0 // Loop back to the first image
        }
      }

      const prevImage = () => {
        if (currentIndex.value > 0) {
          currentIndex.value--
        } else {
          currentIndex.value = posts.value.length - 1 // Loop back to the last image
        }
      }

      const goToLink = () => {
        window.open(posts.value[currentIndex.value].data.permalink, '_blank')
      }

      const currentPostUrl = () => {
        return posts.value[currentIndex.value]?.data.url
      }

      const currentPostTitle = () => {
        return posts.value[currentIndex.value]?.data.title
      }

      const hasPrevious = () => {
        return currentIndex.value > 0
      }

      const hasNext = () => {
        return currentIndex.value < posts.value.length - 1
      }

      const acceptNSFW = () => {
        isNSFWDialogOpen.value = false
      }

      const closeNSFWDialog = () => {
        isNSFWDialogOpen.value = false
        posts.value = [] // Clear posts if the user decides not to proceed
      }

      // onMounted(fetchRedditImages)

      return {
        subreddit,
        sortOption,
        sortOptions,
        posts,
        isSlideshowOpen,
        isNSFWDialogOpen,
        openSlideshow,
        closeSlideshow,
        fetchRedditImages,
        currentPostUrl,
        currentPostTitle,
        nextImage,
        prevImage,
        goToLink,
        toggleSlideshow,
        isPlaying,
        hasPrevious,
        hasNext,
        acceptNSFW,
        closeNSFWDialog,
        isImage, // Ensure `isImage` is returned here
      }
    },
  }
</script>

<style scoped>
.v-card {
  margin-bottom: 20px;
}
</style>
