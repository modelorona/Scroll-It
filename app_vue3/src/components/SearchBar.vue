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
import { ref, watch } from 'vue';
import { useGalleryStore } from '@/stores/gallery';
import { debounce } from 'lodash';

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

const sortOptions = ['hot', 'new', 'top'];

// When a subreddit is selected from the list, update the search query to match
watch(() => subreddit.value, (newValue) => {
  if (newValue) {
    searchQuery.value = newValue;
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
};

const reset = () => {
  subreddit.value = '';
  searchQuery.value = '';
  emit('update:subreddit', '');
  emit('reset');
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
  isMenuOpen.value = subredditItems.value.length > 0;
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
