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
            <v-icon v-if="post.isAlbum" class="album-icon">mdi-image-multiple</v-icon>
            <v-img
              :aspect-ratio="1"
              class="link-cursor"
              :src="post.isAlbum ? post.images[0] : post.postData.url"
              @click="$emit('selectImage', index)"
            />
          </div>
          <v-card-title>{{ post.postData.title }}</v-card-title>
          <v-card-actions>
            <v-btn
              color="primary"
              :href="post.postData.url"
              target="_blank"
              text
            >
              View Image On Reddit
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

const props = defineProps({
  posts: Array,
  agreedToNSFW: Boolean,
  fetchingImages: Boolean,
});

defineEmits(["selectImage"]);

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
}
.album-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 2px;
  z-index: 1;
}
</style>
