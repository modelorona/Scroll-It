<!--
  - Copyright 2025 modelorona
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
      @search="handleSearch"
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
        :type="galleryStore.error.type"
        :text="galleryStore.error.message"
      />
    </v-container>

    <v-container
      v-if="galleryStore.visiblePosts.length > 0"
      fluid
      class="py-0"
    >
      <v-chip-group>
        <v-chip
          v-for="type in mediaTypes"
          :key="type.value"
          :variant="galleryStore.mediaTypeFilter.includes(type.value) ? 'flat' : 'outlined'"
          :color="galleryStore.mediaTypeFilter.includes(type.value) ? 'primary' : undefined"
          size="small"
          @click="galleryStore.toggleMediaTypeFilter(type.value)"
        >
          <v-icon
            start
            size="small"
          >
            {{ type.icon }}
          </v-icon>
          {{ type.label }}
        </v-chip>
      </v-chip-group>
    </v-container>

    <ImageGridSkeleton v-if="galleryStore.fetchingImages && galleryStore.posts.length === 0" />
    <ImageGrid
      v-else
      :fetching-images="galleryStore.fetchingImages"
      :posts="galleryStore.filteredPosts"
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
      :slideshow-interval-ms="galleryStore.slideshowIntervalTimeMs"
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
import {useGalleryStore, normalizeSubreddits} from '@/stores/gallery';
import {useRoute, useRouter} from 'vue-router';
import {watch, onMounted} from 'vue';

const galleryStore = useGalleryStore();

const mediaTypes = [
  { value: 'image', label: 'Images', icon: 'mdi-image' },
  { value: 'album', label: 'Albums', icon: 'mdi-image-multiple' },
  { value: 'video', label: 'Videos', icon: 'mdi-play-circle' },
  { value: 'embed', label: 'Embeds', icon: 'mdi-youtube' },
];
const route = useRoute();
const router = useRouter();

function handleSearch() {
  galleryStore.fetchRedditImages(true);
  const normalized = normalizeSubreddits(galleryStore.subreddit);
  if (normalized) {
    router.replace(`/r/${normalized}?type=${galleryStore.sortOption}`);
  }
}

onMounted(() => {
  const subsParam = route.params.subreddits || route.params.subreddit || '';
  if (subsParam) {
    const subs = subsParam.replace(/\+/g, ', ');
    galleryStore.subreddit = subs;
    galleryStore.fetchRedditImages(true);
  }
  if (route.query.type) {
    galleryStore.sortOption = route.query.type;
  }
});

watch(() => galleryStore.currentIndex, (newValue) => {
    // Only fetch more if:
    // 1. We have posts already (avoid infinite loop when empty)
    // 2. We're near the end of current posts
    // 3. Not already fetching
    // 4. No error state
    if (galleryStore.visiblePosts.length > 0 &&
      newValue >= galleryStore.visiblePosts.length - 6 &&
      !galleryStore.fetchingImages &&
      !galleryStore.error) {
      galleryStore.fetchRedditImages();
    }
  });
</script>
