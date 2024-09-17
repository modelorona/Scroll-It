<template>
  <v-container fluid>
    <v-row v-if="posts.length > 0">
      <v-col v-for="(post, index) in posts" :key="post.data.id" cols="12" md="4">
        <v-card v-if="!post.data.over_18 || agreedToNSFW">
          <v-img :aspect-ratio="1" :src="post.data.url" @click="$emit('selectImage', index)" />
          <v-card-title>{{ post.data.title }}</v-card-title>
          <v-card-actions>
            <v-btn color="primary" :href="post.data.url" target="_blank" text>View Image On Reddit</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

  <script setup>
  defineProps({
    posts: Array,
    agreedToNSFW: Boolean,
  })

  defineEmits(['selectImage'])
  </script>
