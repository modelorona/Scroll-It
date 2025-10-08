<template>
  <v-container fluid>
    <v-row v-if="posts.length > 0">
      <v-col
        v-for="(post, index) in posts"
        :key="post.postData.id"
        cols="12"
        md="4"
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
              @click="$emit('selectImage', index)"
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
import { ref, watch } from "vue";
import logo from "@/assets/logo-white.png";

const props = defineProps({
  posts: Array,
  agreedToNSFW: Boolean,
  fetchingImages: Boolean,
});

defineEmits(["selectImage"]);

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
