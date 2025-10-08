<template>
  <v-container fluid>
    <div v-if="posts.length > 0" v-bind="containerProps" class="virtual-scroll-container" @scroll.passive="handleScroll">
      <div v-bind="wrapperProps">
        <v-row v-for="{ data: postRow } in list" :key="postRow[0] ? postRow[0].postData.id : ''">
          <v-col
            v-for="post in postRow"
            :key="post.postData.id"
            cols="12"
            md="3"
          >
            <v-card v-if="!post.postData.over_18 || agreedToNSFW">
              <div class="image-container">
                <v-icon v-if="post.mediaType === 'album'" class="album-icon">mdi-image-multiple</v-icon>
                <v-icon v-if="post.mediaType === 'video' || post.mediaType === 'embed'" class="video-icon">mdi-play-circle</v-icon>
                <v-img
                  :aspect-ratio="1"
                  class="link-cursor"
                  :src="getThumbnail(post)"
                  cover
                  @click="$emit('selectImage', post.originalIndex)"
                >
                  <template #error>
                    <v-img :src="logo" class="placeholder-image" />
                  </template>
                </v-img>
              </div>
              <v-card-title>{{ post.postData.title }}</v-card-title>
              <v-card-actions>
                <v-btn
                  color="primary"
                  :href="`https://reddit.com${post.postData.permalink}`"
                  target="_blank"
                  text
                >
                  View Post On Reddit
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <v-row v-if="fetchingImages">
      <v-banner icon="mdi-download">
        <template v-slot:text>
          <span v-html="loadingMessage"></span>
        </template>
      </v-banner>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useVirtualList } from "@vueuse/core";
import logo from "@/assets/logo-white.png";

const props = defineProps({
  posts: Array,
  agreedToNSFW: Boolean,
  fetchingImages: Boolean,
});

const emit = defineEmits(["selectImage", "loadMore"]);

const handleScroll = (event) => {
  const { scrollTop, clientHeight, scrollHeight } = event.target;
  if (scrollTop + clientHeight >= scrollHeight - 500) { // 500px threshold
    emit("loadMore");
  }
};

// Add originalIndex to each post for the click handler
const postsWithIndex = computed(() => 
  props.posts.map((post, index) => ({ ...post, originalIndex: index }))
);

// Chunk posts into rows for the grid layout
const postRows = computed(() => {
  const rows = [];
  for (let i = 0; i < postsWithIndex.value.length; i += 4) { // 4 items per row
    rows.push(postsWithIndex.value.slice(i, i + 4));
  }
  return rows;
});

const { list, containerProps, wrapperProps } = useVirtualList(postRows, {
  itemHeight: 450, // Estimate the height of a card row
  overscan: 1, // Render 1 extra row top and bottom
});

const getThumbnail = (post) => {
  // Use the thumbnail from post data if it's a valid URL
  if (post.postData.thumbnail && post.postData.thumbnail.startsWith('http')) {
    return post.postData.thumbnail;
  }
  // Fallback for videos/embeds to a higher quality preview if available
  if ((post.mediaType === 'video' || post.mediaType === 'embed') && post.postData.preview?.images[0]?.source?.url) {
    return post.postData.preview.images[0].source.url.replace(/&amp;/g, '&');
  }
  // Fallback for albums to the first image
  if (post.mediaType === 'album') {
    return post.images[0];
  }
  // Fallback for single images to the direct URL
  if (post.mediaType === 'image') {
    return post.postData.url;
  }
  // If all else fails, return empty to trigger the error slot
  return '';
};

const loadingMessage = ref("Fetching images...");
let timeoutId = null;

watch(
  () => props.fetchingImages,
  (newVal) => {
    if (newVal) {
      // Reset message
      loadingMessage.value = "Fetching images...";

      // Clear any old timers
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set new timer
      timeoutId = setTimeout(() => {
        loadingMessage.value =
          `Fetching images taking too long? Subreddit may not exist or Reddit may be blocking your request due to your location. 
          Check out <a href="https://protonvpn.com" target="_blank" rel="noopener noreferrer">ProtonVPN</a> 
          or <a href="https://mullvad.net" target="_blank" rel="noopener noreferrer">Mullvad</a>.`;
      }, 2000);
    } else {
      // Stop timer if fetching finished early
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  }
);
</script>

<style scoped>
.virtual-scroll-container {
  height: calc(100vh - 104px); /* App bar (64px) + Footer (40px) */
  overflow-y: auto;
}
.link-cursor {
  cursor: pointer;
}
.image-container {
  position: relative;
  background-color: #212121; /* Dark background for consistency */
}
.album-icon, .video-icon {
  position: absolute;
  color: white;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  padding: 2px;
  z-index: 1;
}
.album-icon {
  top: 8px;
  right: 8px;
}
.video-icon {
  top: 8px;
  left: 8px;
}
.placeholder-image {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  opacity: 0.3;
}
</style>
