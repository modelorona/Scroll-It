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
        hint="Enter one subreddit or multiple separated by commas"
        label="Enter Subreddit Name(s)"
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
  <v-row
    v-if="settingsStore.searchHistory.length > 0"
    class="mt-0"
  >
    <v-col class="pt-0">
      <div class="d-flex align-center flex-wrap ga-1">
        <span class="text-caption text-medium-emphasis mr-1">Recent:</span>
        <v-chip
          v-for="term in settingsStore.searchHistory"
          :key="term"
          size="small"
          variant="outlined"
          @click="searchFromHistory(term)"
        >
          {{ term }}
        </v-chip>
        <v-btn
          aria-label="Clear search history"
          icon
          size="x-small"
          variant="text"
          class="ml-1"
          @click="settingsStore.clearSearchHistory()"
        >
          <v-icon size="small">
            mdi-close-circle-outline
          </v-icon>
        </v-btn>
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import {ref, watch} from 'vue';
import {useGalleryStore} from '@/stores/gallery';
import {useSettingsStore} from '@/stores/settings';
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
const settingsStore = useSettingsStore();

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

// When a subreddit is selected from the dropdown, append it to existing comma-separated input
watch(() => subreddit.value, (newValue) => {
  if (newValue && newValue !== searchQuery.value) {
    const parts = searchQuery.value.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      parts[parts.length - 1] = newValue;
      searchQuery.value = parts.join(', ');
    } else {
      searchQuery.value = newValue;
    }
    isMenuOpen.value = false;
    justSearched.value = true;
  }
});

watch(() => props.sortOption, (newValue) => {
  sortOption.value = newValue;
});

const search = () => {
  emit('update:subreddit', searchQuery.value);
  emit('search');
  settingsStore.addSearchHistory(searchQuery.value);
  isMenuOpen.value = false;
  justSearched.value = true;
};

const searchFromHistory = (term) => {
  subreddit.value = term;
  searchQuery.value = term;
  emit('update:subreddit', term);
  emit('search');
  settingsStore.addSearchHistory(term);
};

const reset = () => {
  subreddit.value = '';
  searchQuery.value = '';
  emit('update:subreddit', '');
  emit('reset');
  justSearched.value = false;
};

const handleFocus = () => {
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
  // For comma-separated input, only search the last term
  const lastTerm = query?.split(',').pop()?.trim() || '';
  if (!lastTerm || lastTerm.length < 2) {
    subredditItems.value = [];
    return;
  }
  loading.value = true;
  subredditItems.value = await galleryStore.searchSubreddits(lastTerm);

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
