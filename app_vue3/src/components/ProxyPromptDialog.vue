<template>
  <v-dialog
    :model-value="galleryStore.isProxyPromptOpen"
    max-width="500px"
    persistent
  >
    <v-card>
      <v-card-title>Having Trouble Fetching Content?</v-card-title>
      <v-card-text>
        <p>It seems we're having trouble fetching content from Reddit. This can sometimes be caused by network restrictions or silly age verification requirements set by your country.</p>
        <p>Would you like to try again using our proxy? This may help bypass the issue.</p>

        <v-divider class="my-4" />

        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Proxy Status:</span>
          <v-chip
            :color="statusColor"
            :prepend-icon="statusIcon"
            size="small"
          >
            {{ statusText }}
          </v-chip>
        </div>

        <div
          v-if="galleryStore.proxyStatusDetails"
          class="text-caption text-medium-emphasis ml-4"
        >
          <div>• Rate Limiting: {{ galleryStore.proxyStatusDetails.firestore === 'available' ? '✓ Active' : '✗ Unavailable' }}</div>
          <div>• Reddit API: {{ galleryStore.proxyStatusDetails.reddit === 'available' ? '✓ Reachable' : '✗ Unreachable' }}</div>
        </div>

        <v-alert
          v-if="galleryStore.proxyStatus === 'degraded'"
          type="warning"
          density="compact"
          class="mt-3"
        >
          Proxy is partially available. Some features may not work correctly.
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          variant="text"
          @click="galleryStore.declineProxy"
        >
          No, Thanks
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="galleryStore.proxyStatus === 'unavailable' || galleryStore.proxyStatus === 'checking'"
          @click="galleryStore.enableProxyAndRetry"
        >
          Yes, Try Again
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useGalleryStore } from '@/stores/gallery'

const galleryStore = useGalleryStore()

// Check proxy status when dialog opens
watch(() => galleryStore.isProxyPromptOpen, (isOpen) => {
  console.log('ProxyPromptDialog watch triggered, isOpen:', isOpen)
  if (isOpen) {
    console.log('Checking proxy status...')
    galleryStore.checkProxyStatus()
  }
})

const statusColor = computed(() => {
  switch (galleryStore.proxyStatus) {
    case 'operational': return 'success'
    case 'degraded': return 'warning'
    case 'unavailable': return 'error'
    case 'checking': return 'info'
    default: return 'grey'
  }
})

const statusIcon = computed(() => {
  switch (galleryStore.proxyStatus) {
    case 'operational': return 'mdi-check-circle'
    case 'degraded': return 'mdi-alert-circle'
    case 'unavailable': return 'mdi-close-circle'
    case 'checking': return 'mdi-loading mdi-spin'
    default: return 'mdi-help-circle'
  }
})

const statusText = computed(() => {
  switch (galleryStore.proxyStatus) {
    case 'operational': return 'Fully Operational'
    case 'degraded': return 'Partially Available'
    case 'unavailable': return 'Unavailable'
    case 'checking': return 'Checking...'
    default: return 'Unknown'
  }
})
</script>
