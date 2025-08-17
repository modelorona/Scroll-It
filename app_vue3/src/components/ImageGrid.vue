<template>
  <v-container fluid>
    <v-row v-if="posts.length > 0">
      <v-col
        v-for="(post, index) in posts"
        :key="post.data.id"
        cols="12"
        md="4"
      >
        <v-card v-if="!post.data.over_18 || agreedToNSFW">
          <v-img
            :aspect-ratio="1"
            class="link-cursor"
            :src="post.data.url"
            @click="$emit('selectImage', index)"
          />
          <v-card-title>{{ post.data.title }}</v-card-title>
          <v-card-actions>
            <v-btn
              color="primary"
              :href="post.data.url"
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
</style>
