<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
    @after-leave="close"
    @keydown.esc="close"
  >
    <v-card class="full-size-card" color="black">
      <v-icon class="close-button" color="white" title="Close" @click="close">mdi-close</v-icon>
      
      <v-card-text class="full-size-card-text">
        <v-progress-circular
          v-if="mediaLoading"
          class="loader"
          color="primary"
          indeterminate
          size="64"
        />
        
        <div v-if="currentPost" class="media-wrapper">
          <v-img
            v-if="currentPost.mediaType === 'image' || currentPost.mediaType === 'album'"
            :key="currentPost.images[currentImageIndex]"
            class="full-size-media"
            :src="currentPost.images[currentImageIndex]"
            @load="mediaLoading = false"
          />
          <video
            v-else-if="currentPost.mediaType === 'video'"
            :key="currentPost.images[0]"
            class="full-size-media"
            autoplay
            loop
            muted
            controls
            @loadeddata="mediaLoading = false"
            @ended="$emit('mediaEnded')"
          >
            <source :src="currentPost.images[0]" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <div
            v-else-if="currentPost.mediaType === 'embed'"
            class="embed-container"
            v-html="currentPost.images[0]"
          ></div>
        </div>
      </v-card-text>
      
      <v-card-actions class="actions-bar">
        <div v-if="showTooltip" class="tooltip">
          Use <kbd>←</kbd>, <kbd>→</kbd> to navigate, <kbd>Space</kbd> to toggle slideshow, and <kbd>Esc</kbd> to close
        </div>
        <v-row align="center" class="flex-wrap" justify="center">
          <v-btn color="primary" @click="$emit('goToLink')"><v-icon>mdi-open-in-new</v-icon> Reddit</v-btn>
          <v-btn :disabled="!hasPrevious" @click="$emit('prevImage')" @keydown.left.prevent="$emit('prevImage')"><v-icon>mdi-arrow-left</v-icon>Previous</v-btn>
          <v-btn :disabled="!hasNext" @click="$emit('nextImage')" @keydown.right.prevent="$emit('nextImage')">Next<v-icon>mdi-arrow-right</v-icon></v-btn>
          <v-btn @click="$emit('skipPost')">Skip Post<v-icon>mdi-fast-forward</v-icon></v-btn>
          <v-btn @click="$emit('toggleSlideshow')" @keydown.space.prevent="$emit('toggleSlideshow')">
            {{ isPlaying ? 'Pause Slideshow' : 'Start Slideshow' }} <v-icon v-if="isPlaying">mdi-pause</v-icon> <v-icon v-else>mdi-play</v-icon>
          </v-btn>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

  const props = defineProps({
    modelValue: Boolean,
    currentPost: Object,
    currentImageIndex: Number,
    hasPrevious: Boolean,
    hasNext: Boolean,
    isPlaying: Boolean,
  })

  const emit = defineEmits(['update:modelValue', 'goToLink', 'prevImage', 'nextImage', 'toggleSlideshow', 'stopSlideshow', 'skipPost', 'mediaEnded'])

  const dialog = ref(props.modelValue)
  const mediaLoading = ref(true)
  const showTooltip = ref(false)

  watch(() => props.modelValue, newValue => {
    dialog.value = newValue
    if (newValue) {
      mediaLoading.value = true
      showShortcutTooltip()
    }
  })

  watch(dialog, newValue => {
    emit('update:modelValue', newValue)
  })
  
  watch(() => props.currentPost, async (newPost) => {
    mediaLoading.value = true
    if (newPost && newPost.mediaType === 'embed') {
      await nextTick()
      // The iframe doesn't have a reliable load event we can capture here.
      // We'll assume it loads reasonably quickly and hide the loader.
      setTimeout(() => {
        mediaLoading.value = false
      }, 1000)
    }
  })

  const close = () => {
    emit('stopSlideshow')
    dialog.value = false
  }

  // Function to show the tooltip
  const showShortcutTooltip = () => {
    showTooltip.value = true
    setTimeout(() => {
      showTooltip.value = false // Auto-hide after 3 seconds
    }, 5000)
  }

  // Global keydown handler
  const handleKeydown = (event) => {
    if (!dialog.value) return // Only handle keys if the dialog is open

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
  display: flex;
  flex-direction: column;
}
.full-size-card-text {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 0 !important;
}
.media-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.full-size-media {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.embed-container {
  width: 100%;
  max-width: 90vw; /* Limit width of embed */
  aspect-ratio: 16 / 9; /* Common video aspect ratio */
  background: black;
}
.embed-container ::v-deep(iframe) {
  width: 100%;
  height: 100%;
}
.loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}
.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 20;
  cursor: pointer;
}
.actions-bar {
  flex-shrink: 0; /* Prevent the actions bar from shrinking */
  background-color: rgba(0, 0, 0, 0.5);
  position: relative; /* Needed for tooltip positioning */
}
.tooltip {
  position: absolute;
  bottom: 100%; /* Position above the actions bar */
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  background-color: #333;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  z-index: 10;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: opacity 0.3s ease;
}
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%; /* Arrow points down */
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
