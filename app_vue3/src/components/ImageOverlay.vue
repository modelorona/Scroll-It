<template>
  <v-container class="full-size-card" fluid>
    <v-dialog
      v-model="imageOverlay"
      max-height="100vh"
      max-width="100vw"
      @after-leave="close"
      @keydown.esc="close"
    >
      <v-card class="full-size-card">
        <v-card-text class="full-size-card-text">
          <v-progress-circular
            v-if="imageLoading"
            class="loader"
            color="primary"
            indeterminate
            size="64"
          />
          <v-img
            :key="currentPostUrl"
            class="full-size-image"
            :src="currentPostUrl"
            @load="imageLoading = false"
          />
        </v-card-text>
        <v-card-actions>
          <v-row align="center" class="flex-wrap" justify="center">
            <v-btn color="primary" @click="$emit('goToLink')"><v-icon>mdi-open-in-new</v-icon> Reddit</v-btn>
            <v-btn :disabled="!hasPrevious" @click="$emit('prevImage')"><v-icon>mdi-arrow-left</v-icon>Previous</v-btn>
            <v-btn :disabled="!hasNext" @click="$emit('nextImage')">Next<v-icon>mdi-arrow-right</v-icon></v-btn>
            <v-btn @click="$emit('toggleSlideshow')">
              {{ isPlaying ? 'Pause Slideshow' : 'Start Slideshow' }} <v-icon v-if="isPlaying">mdi-pause</v-icon> <v-icon v-else>mdi-play</v-icon>
            </v-btn>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

  <script setup>
  import { ref, watch } from 'vue'

  const props = defineProps({
    imageOverlay: Boolean,
    currentPostUrl: String,
    hasPrevious: Boolean,
    hasNext: Boolean,
    isPlaying: Boolean,
  })

  const emit = defineEmits(['update:imageOverlay', 'goToLink', 'prevImage', 'nextImage', 'toggleSlideshow', 'stopSlideshow'])

  const imageOverlay = ref(props.imageOverlay)
  const imageLoading = ref(true)

  watch(() => props.imageOverlay, newValue => {
    imageOverlay.value = newValue
  })

  watch(imageOverlay, newValue => {
    emit('update:imageOverlay', newValue)
  })

  const close = () => {
    emit('stopSlideshow')
    imageOverlay.value = false
  }
  </script>

<style scoped>
.full-size-card {
  height: 100vh;
  width: 100vw;
}
.full-size-card-text {
  height: 94vh;
  width: 100vw;
}
.full-size-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@media (max-width: 768px) {
  .full-size-card {
    height: auto;
    width: auto;
  }
  .full-size-card-text {
    height: auto;
    width: auto;
  }
  .full-size-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}
</style>
