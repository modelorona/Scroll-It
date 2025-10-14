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
  <v-container fluid>
    <div
      v-if="posts.length > 0"
      v-bind="containerProps"
      class="virtual-scroll-container"
    >
      <div v-bind="wrapperProps">
        <v-row
          v-for="{ data: postRow } in list"
          :key="postRow[0] ? postRow[0].postData.id : ''"
        >
          <v-col
            v-for="post in postRow"
            :key="post.postData.id"
            cols="12"
            md="3"
          >
            <v-card v-if="!post.postData.over_18 || agreedToNSFW">
              <div class="image-container">
                <v-icon
                  v-if="post.mediaType === 'album'"
                  class="album-icon"
                >
                  mdi-image-multiple
                </v-icon>
                <v-icon
                  v-if="post.mediaType === 'video' || post.mediaType === 'embed'"
                  class="video-icon"
                >
                  mdi-play-circle
                </v-icon>
                <v-img
                  :aspect-ratio="1"
                  class="link-cursor"
                  :src="getThumbnail(post)"
                  cover
                  @click="$emit('selectImage', post.originalIndex)"
                >
                  <template #error>
                    <v-img
                      :src="logo"
                      class="placeholder-image"
                    />
                  </template>
                </v-img>
              </div>
              <v-card-title>{{ post.postData.title }}</v-card-title>
              <v-card-actions>
                <v-btn
                  color="primary"
                  :href="`https://reddit.com${post.postData.permalink}`"
                  target="_blank"
                  variant="text"
                >
                  View Post On Reddit
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Loading indicator for infinite scroll -->
    <v-row
      v-if="fetchingImages && posts.length > 0"
      class="mt-4 mb-8"
      justify="center"
    >
      <v-col class="text-center" cols="12">
        <v-progress-circular
          :size="40"
          :width="4"
          color="primary"
          indeterminate
        />
        <div class="text-h6 mt-2 text-medium-emphasis">
          Loading more images...
        </div>
      </v-col>
    </v-row>

    <v-fab
      v-if="showBackToTop"
      icon="mdi-arrow-up"
      class="ma-4 mb-12"
      location="bottom end"
      fixed
      @click="scrollToTop"
    />
  </v-container>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useVirtualList} from "@vueuse/core";
import logo from "@/assets/logo-white.png";

const props = defineProps({
  posts: {
    type: Array,
    default: () => [],
  },
  agreedToNSFW: Boolean,
  fetchingImages: Boolean,
});

const emit = defineEmits(["selectImage", "loadMore"]);

const showBackToTop = ref(false);

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const clientHeight = window.innerHeight;
  const scrollHeight = document.documentElement.scrollHeight;

  // Only load more if we have posts and not already fetching
  if (props.posts.length > 0 &&
    scrollTop + clientHeight >= scrollHeight - 500 &&
    !props.fetchingImages) { // 500px threshold
    emit("loadMore");
  }
  showBackToTop.value = scrollTop > 200;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
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

// Add window scroll event listener
onMounted(() => {
  window.addEventListener('scroll', handleScroll, {passive: true});
  // Check initial scroll position
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.virtual-scroll-container {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

.image-container {
  position: relative;
}

.album-icon,
.video-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  padding: 4px;
}

.link-cursor {
  cursor: pointer;
}

.placeholder-image {
  opacity: 0.3;
}
</style>
