<!--
  - Copyright 2025 Clidey, Inc.
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  -     http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<template>
  <v-container
    fluid
    class="px-md-4 align-content"
  >
    <SearchBar
      v-model:sort-option="galleryStore.sortOption"
      v-model:subreddit="galleryStore.subreddit"
      @reset="galleryStore.resetSearch"
      @search="galleryStore.fetchRedditImages(true)"
    />

    <NSFWAlert
      v-model:is-open="galleryStore.isNSFWDialogOpen"
      @accept="galleryStore.acceptNSFW"
      @decline="galleryStore.declineNSFW"
    />

    <v-container
      v-if="galleryStore.infoBannerVisible && galleryStore.visiblePosts.length > 0 && !galleryStore.isNSFWDialogOpen"
      fluid
    >
      <v-row
        align="center"
        justify="center"
      >
        <v-banner
          icon="mdi-information"
          lines="one"
          rounded
          :stacked="false"
          text="Click on an image to enlarge it"
        >
          <template #actions>
            <v-btn
              icon="mdi-close"
              @click="galleryStore.infoBannerVisible = false"
            />
          </template>
        </v-banner>
      </v-row>
    </v-container>

    <v-container
      v-if="galleryStore.visiblePosts.length > 0 && !galleryStore.isNSFWDialogOpen"
      fluid
    >
      <v-row
        align="center"
        justify="center"
      >
        <v-btn @click="galleryStore.startSlideshow(0)">
          Start slideshow
        </v-btn>
      </v-row>
    </v-container>

    <v-container
      v-if="galleryStore.error"
      fluid
    >
      <v-alert
        type="error"
        :text="galleryStore.error"
      />
    </v-container>

    <ImageGridSkeleton v-if="galleryStore.fetchingImages && galleryStore.posts.length === 0" />
    <ImageGrid
      v-else
      :agreed-to-n-s-f-w="galleryStore.agreedToNSFW"
      :fetching-images="galleryStore.fetchingImages"
      :posts="galleryStore.visiblePosts"
      @select-image="galleryStore.setOverlayImage"
      @load-more="galleryStore.fetchRedditImages"
    />

    <MediaOverlay
      v-model="galleryStore.imageOverlay"
      :current-post="galleryStore.currentPost"
      :current-image-index="galleryStore.currentImageIndex"
      :has-next="galleryStore.hasNext"
      :has-previous="galleryStore.hasPrevious"
      :is-playing="galleryStore.isPlaying"
      @go-to-link="galleryStore.goToLink"
      @next-image="galleryStore.nextImage"
      @prev-image="galleryStore.prevImage"
      @skip-post="galleryStore.skipPost"
      @stop-slideshow="galleryStore.stopSlideshow"
      @toggle-slideshow="galleryStore.toggleSlideshow"
      @media-ended="galleryStore.handleMediaEnded"
    />
  </v-container>
</template>

<script setup>
import {useGalleryStore} from '@/stores/gallery';
import {useRoute} from 'vue-router';
import {watch} from 'vue';

const galleryStore = useGalleryStore();
  const route = useRoute();

  // Set initial subreddit from route params
  if (route.params.subreddit) {
    galleryStore.subreddit = route.params.subreddit;
  }
  if (route.query.type) {
    galleryStore.sortOption = route.query.type;
  }

  watch(() => galleryStore.currentIndex, (newValue) => {
    if (newValue >= galleryStore.visiblePosts.length - 6 && !galleryStore.fetchingImages) {
      galleryStore.fetchRedditImages();
    }
  });
</script>
