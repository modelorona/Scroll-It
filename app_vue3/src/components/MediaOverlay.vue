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
  <v-dialog
    v-model="dialog"
    fullscreen
    :scrim="false"
    transition="dialog-bottom-transition"
    @after-leave="close"
    @keydown.esc="close"
  >
    <v-card
      class="full-size-card"
      color="black"
    >
      <v-icon
        aria-label="Close overlay"
        class="close-button"
        color="white"
        role="button"
        tabindex="0"
        title="Close"
        @click="close"
      >
        mdi-close
      </v-icon>
      
      <v-card-text class="full-size-card-text">
        <v-progress-circular
          v-if="mediaLoading"
          class="loader"
          color="primary"
          indeterminate
          size="64"
        />
        
        <div
          v-if="currentPost"
          ref="mediaWrapperRef"
          class="media-wrapper"
        >
          <v-img
            v-if="currentPost.mediaType === 'image' || currentPost.mediaType === 'album'"
            :key="currentPost.images[currentImageIndex]"
            class="full-size-media"
            :src="currentPost.images[currentImageIndex]"
            @load="mediaLoading = false"
          />
          <video
            v-else-if="currentPost.mediaType === 'video' || currentPost.mediaType === 'gif'"
            :key="currentPost.images[0]"
            :src="currentPost.images[0]"
            class="full-size-media"
            autoplay
            loop
            muted
            controls
            preload="metadata"
            @loadeddata="mediaLoading = false"
            @ended="$emit('mediaEnded')"
          >
            Your browser does not support the video tag.
          </video>
          <div
            v-else-if="currentPost.mediaType === 'embed'"
            class="embed-container"
            v-html="currentPost.images[0]"
          />
        </div>
      </v-card-text>
      
      <div
        v-if="showProgressBar"
        :key="progressKey"
        class="slideshow-progress"
        :style="{ animationDuration: slideshowIntervalMs + 'ms' }"
      />
      <div class="actions-bar">
        <div
          v-if="showTooltip"
          class="tooltip"
        >
          Use <kbd>←</kbd>, <kbd>→</kbd> to navigate, <kbd>Space</kbd> to toggle slideshow, and <kbd>Esc</kbd> to close
        </div>
        <div
          v-if="currentPost?.mediaType === 'album'"
          class="album-counter"
        >
          {{ currentImageIndex + 1 }} of {{ currentPost.images.length }}
        </div>
        <div class="actions-buttons">
          <v-btn
            size="small"
            :disabled="!hasPrevious"
            @click="$emit('prevImage')"
            @keydown.left.prevent="$emit('prevImage')"
          >
            <v-icon>mdi-arrow-left</v-icon> Prev
          </v-btn>
          <v-btn
            size="small"
            :disabled="!hasNext"
            @click="$emit('nextImage')"
            @keydown.right.prevent="$emit('nextImage')"
          >
            Next <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
          <v-btn
            size="small"
            @click="$emit('toggleSlideshow')"
            @keydown.space.prevent="$emit('toggleSlideshow')"
          >
            {{ isPlaying ? 'Pause' : 'Play' }}
            <v-icon>{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
          </v-btn>
          <v-btn
            size="small"
            @click="$emit('skipPost')"
          >
            Skip <v-icon>mdi-fast-forward</v-icon>
          </v-btn>
          <v-btn
            color="primary"
            size="small"
            @click="$emit('goToLink')"
          >
            <v-icon>mdi-open-in-new</v-icon> Reddit
          </v-btn>
          <v-btn
            size="small"
            :disabled="currentPost?.mediaType === 'embed'"
            :loading="downloading"
            @click="downloadMedia"
          >
            <v-icon>mdi-download</v-icon> Download
          </v-btn>
          <v-btn
            size="small"
            @click="copyLink"
          >
            <v-icon>{{ linkCopied ? 'mdi-check' : 'mdi-link-variant' }}</v-icon> {{ linkCopied ? 'Copied!' : 'Copy Link' }}
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
  import { useSwipe } from '@vueuse/core'

  const props = defineProps({
    modelValue: Boolean,
    currentPost: {
      type: Object,
      default: () => ({}),
    },
    currentImageIndex: {
      type: Number,
      default: 0,
    },
    hasPrevious: Boolean,
    hasNext: Boolean,
    isPlaying: Boolean,
    slideshowIntervalMs: {
      type: Number,
      default: 5000,
    },
  })

  const emit = defineEmits(['update:modelValue', 'goToLink', 'prevImage', 'nextImage', 'toggleSlideshow', 'stopSlideshow', 'skipPost', 'mediaEnded'])

  const dialog = ref(props.modelValue)
  const mediaLoading = ref(true)
  const showTooltip = ref(false)
  const progressKey = ref(0)
  const downloading = ref(false)
  const linkCopied = ref(false)
  const triggerElement = ref(null)
  const mediaWrapperRef = ref(null)

  const { direction } = useSwipe(mediaWrapperRef, {
    threshold: 50,
    onSwipeEnd() {
      if (direction.value === 'left' && props.hasNext) {
        emit('nextImage')
      } else if (direction.value === 'right' && props.hasPrevious) {
        emit('prevImage')
      }
    },
  })

  const showProgressBar = computed(() => {
    return props.isPlaying
  })

  // Reset progress bar animation and preload next image on slide change
  const preloadedUrls = new Set()
  watch([() => props.currentPost, () => props.currentImageIndex], () => {
    progressKey.value++
    preloadNextImage()
  })

  function preloadNextImage() {
    const post = props.currentPost
    if (!post) return

    let url = null
    if (post.mediaType === 'album' && props.currentImageIndex < post.images.length - 1) {
      // Next image in the same album
      url = post.images[props.currentImageIndex + 1]
    }
    // Don't preload across posts — we don't have access to the next post's data here

    if (url && !preloadedUrls.has(url)) {
      preloadedUrls.add(url)
      const img = new Image()
      img.src = url
    }
  }

  watch(() => props.modelValue, async (newValue) => {
    dialog.value = newValue
    if (newValue) {
      triggerElement.value = document.activeElement
      mediaLoading.value = true
      showShortcutTooltip()
      // Handle embeds when dialog opens
      if (props.currentPost && props.currentPost.mediaType === 'embed') {
        await nextTick()
        setTimeout(() => {
          mediaLoading.value = false
        }, 1000)
      }
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

  const copyLink = async () => {
    if (!props.currentPost) return
    const url = `https://reddit.com${props.currentPost.postData.permalink}`
    await navigator.clipboard.writeText(url)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  }

  const downloadMedia = async () => {
    if (!props.currentPost) return
    downloading.value = true
    try {
      const isAlbum = props.currentPost.mediaType === 'album' || props.currentPost.mediaType === 'image'
      const url = isAlbum ? props.currentPost.images[props.currentImageIndex] : props.currentPost.images[0]
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const ext = blob.type.split('/')[1]?.split(';')[0] || 'jpg'
      const title = props.currentPost.postData.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${title}.${ext}`
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      // Fallback: open in new tab if fetch fails (e.g. CORS)
      const url = props.currentPost.images[props.currentImageIndex ?? 0]
      window.open(url, '_blank')
    } finally {
      downloading.value = false
    }
  }

  const close = () => {
    emit('stopSlideshow')
    dialog.value = false
    nextTick(() => {
      triggerElement.value?.focus?.()
      triggerElement.value = null
    })
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
  flex-shrink: 0;
  background-color: rgba(0, 0, 0, 0.5);
  position: relative;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.actions-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
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
.slideshow-progress {
  height: 3px;
  background: rgb(var(--v-theme-primary));
  animation: progress-fill linear forwards;
  flex-shrink: 0;
}
@keyframes progress-fill {
  from { width: 0%; }
  to { width: 100%; }
}
.album-counter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
/* Hide tooltip on small screens */
@media (max-width: 768px) {
  .tooltip {
    display: none;
  }
}
</style>
