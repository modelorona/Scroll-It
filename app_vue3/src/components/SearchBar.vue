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
  <v-row>
    <v-col
      cols="12"
      md="12"
    >
      <v-autocomplete
        v-model="subreddit"
        v-model:search="searchQuery"
        v-model:menu="isMenuOpen"
        :items="subredditItems"
        :loading="loading"
        clearable
        hint="Start typing to search for a subreddit"
        label="Enter Subreddit Name"
        @keyup.enter="search"
        @focus="handleFocus"
        @update:search="handleSearchUpdate"
      >
        <template #append-inner>
          <v-btn
            icon
            title="Reset"
            size="small"
            class="mx-1"
            @click="reset"
          >
            <v-icon>mdi-restore</v-icon>
          </v-btn>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon
                title="Sort By"
                size="small"
                class="mx-1"
              >
                <v-icon>mdi-sort</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="item in sortOptions"
                :key="item"
                :value="item"
                @click="updateSort(item)"
              >
                <v-list-item-title>
                  {{ item }}
                  <v-icon v-if="item === sortOption">
                    mdi-check
                  </v-icon>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn
            color="secondary"
            icon
            title="Search"
            size="small"
            @click="search"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </template>
      </v-autocomplete>
    </v-col>
  </v-row>
</template>

<script setup>
import {ref, watch} from 'vue';
import {useGalleryStore} from '@/stores/gallery';
import {debounce} from 'lodash';

const props = defineProps({
  subreddit: {
    type: String,
    default: '',
  },
  sortOption: {
    type: String,
    default: 'hot',
  },
});

const emit = defineEmits(['update:subreddit', 'update:sortOption', 'search', 'reset']);

const galleryStore = useGalleryStore();

const subreddit = ref(props.subreddit);
const searchQuery = ref(props.subreddit);
const sortOption = ref(props.sortOption);
const subredditItems = ref([]);
const loading = ref(false);
const isMenuOpen = ref(false);
const justSearched = ref(false);

const sortOptions = ['hot', 'new', 'top'];

// Sync local state with props when they change
watch(() => props.subreddit, (newValue) => {
  subreddit.value = newValue;
  searchQuery.value = newValue;
});

// When a subreddit is selected from the list, update the search query to match
watch(() => subreddit.value, (newValue) => {
  if (newValue && newValue !== searchQuery.value) {
    searchQuery.value = newValue;
    // Close the menu when a subreddit is selected from the dropdown
    isMenuOpen.value = false;
    justSearched.value = true;
  }
});

watch(() => props.sortOption, (newValue) => {
  sortOption.value = newValue;
});

const search = () => {
  // Use the typed query for the search, not the v-model value
  emit('update:subreddit', searchQuery.value);
  emit('search');
  isMenuOpen.value = false;
  justSearched.value = true;
};

const reset = () => {
  subreddit.value = '';
  searchQuery.value = '';
  emit('update:subreddit', '');
  emit('reset');
  justSearched.value = false;
};

const handleFocus = () => {
  // Reset the flag when the input is focused so dropdown can work normally
  justSearched.value = false;
};

const handleSearchUpdate = (newValue) => {
  // Reset the flag when user types something new
  if (newValue !== searchQuery.value) {
    justSearched.value = false;
  }
};

const updateSort = (sort) => {
  sortOption.value = sort;
  emit('update:sortOption', sort);
};

const fetchSubredditSuggestions = async (query) => {
  if (!query || query.length < 2) {
    subredditItems.value = [];
    return;
  }
  loading.value = true;
  subredditItems.value = await galleryStore.searchSubreddits(query);

  // Only open menu if we haven't just searched/selected
  if (!justSearched.value) {
    isMenuOpen.value = subredditItems.value.length > 0;
  }

  loading.value = false;
};

const debouncedSearch = debounce(fetchSubredditSuggestions, 300);

// Watch the search query to fetch suggestions
watch(searchQuery, (newValue) => {
  if (newValue !== subreddit.value) {
    debouncedSearch(newValue);
  }
});
</script>
