<template>
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
        <v-icon color="white" title="Close" @click="close">mdi-close</v-icon>
        <v-img
          :key="currentPostUrl"
          class="full-size-image"
          :src="currentPostUrl"
          @load="imageLoading = false"
        />
      </v-card-text>
      <v-card-actions>
        <div v-if="showTooltip" class="tooltip">
          Use <kbd>←</kbd>, <kbd>→</kbd> to navigate, <kbd>Space</kbd> to toggle slideshow, and <kbd>Esc</kbd> to close
        </div>
        <v-row align="center" class="flex-wrap" justify="center">
          <v-btn color="primary" @click="$emit('goToLink')"><v-icon>mdi-open-in-new</v-icon> Reddit</v-btn>
          <v-btn :disabled="!hasPrevious" @click="$emit('prevImage')" @keydown.left.prevent="$emit('prevImage')"><v-icon>mdi-arrow-left</v-icon>Previous</v-btn>
          <v-btn :disabled="!hasNext" @click="$emit('nextImage')" @keydown.right.prevent="$emit('nextImage')">Next<v-icon>mdi-arrow-right</v-icon></v-btn>
          <v-btn @click="$emit('toggleSlideshow')" @keydown.space.prevent="$emit('toggleSlideshow')">
            {{ isPlaying ? 'Pause Slideshow' : 'Start Slideshow' }} <v-icon v-if="isPlaying">mdi-pause</v-icon> <v-icon v-else>mdi-play</v-icon>
          </v-btn>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
  const showTooltip = ref(false)

  watch(() => props.imageOverlay, newValue => {
    imageOverlay.value = newValue
    if (newValue) showShortcutTooltip()
  })

  watch(imageOverlay, newValue => {
    emit('update:imageOverlay', newValue)
  })

  const close = () => {
    emit('stopSlideshow')
    imageOverlay.value = false
  }

  // Function to show the tooltip
  const showShortcutTooltip = () => {
    showTooltip.value = true
    console.log("here")
    setTimeout(() => {
      showTooltip.value = false // Auto-hide after 3 seconds
    }, 5000)
  }

  // Global keydown handler
  const handleKeydown = (event) => {
    if (!imageOverlay.value) return // Only handle keys if the dialog is open

    switch (event.key) {
      case 'ArrowLeft':
        if (props.hasPrevious) {
          event.preventDefault()
          emit('prevImage')
        }
        break
      case 'ArrowRight':
        if (props.hasNext) {
          event.preventDefault()
          emit('nextImage')
        }
        break
      case ' ':
        event.preventDefault() // Prevent space from scrolling the page
        emit('toggleSlideshow')
        break
      case 'Escape':
        close()
        break
    }
  }

  // Attach and detach global keydown listeners
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
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
.v-card-actions {
  position: relative;
}
.tooltip {
  position: absolute;
  top: -40px;
  background-color: #333;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  z-index: 10;
  right: 38%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: opacity 0.3s ease;
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: -8px; /* Adjust to align the arrow */
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

kbd {
  background-color: #eee;
  border: 1px solid #ccc;
  padding: 2px 4px;
  font-size: 12px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  color: #333;
}
/* Hide tooltip on small screens */
@media (max-width: 768px) {
  .tooltip {
    display: none;
  }
}
</style>
