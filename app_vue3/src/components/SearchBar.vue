<template>
  <v-row>
    <v-col
      cols="12"
      md="12"
    >
      <v-text-field
        v-model="subreddit"
        clearable
        hint="Press enter to search"
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
      </v-text-field>
    </v-col>
  </v-row>
</template>

  <script setup>
  import { ref, watch } from 'vue'

  const props = defineProps({
    subreddit: {
      type: String,
      default: '',
    },
    sortOption: {
      type: String,
      default: 'hot',
    },
  })

  const emit = defineEmits(['update:subreddit', 'update:sortOption', 'search', 'reset'])

  const subreddit = ref(props.subreddit)
  const sortOption = ref(props.sortOption)

  const sortOptions = ['hot', 'new', 'top']

  watch(() => props.subreddit, newValue => {
    subreddit.value = newValue
  })

  watch(() => props.sortOption, newValue => {
    sortOption.value = newValue
  })

  const search = () => {
    emit('update:subreddit', subreddit.value)
    emit('search')
  }

  const reset = () => {
    subreddit.value = ''
    emit('update:subreddit', '')
    emit('reset')
  }

  const updateSort = sort => {
    sortOption.value = sort
    emit('update:sortOption', sort)
  }
  </script>
