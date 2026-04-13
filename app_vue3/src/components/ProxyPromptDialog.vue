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
    :model-value="galleryStore.isProxyPromptOpen"
    max-width="500px"
    persistent
  >
    <v-card>
      <v-card-title class="pt-5">Content Not Loading?</v-card-title>
      <v-card-text>
        <p>We couldn't load content directly from Reddit. This is usually caused by network restrictions or regional access limitations.</p>
        <p>We can route your request through our server instead. This often resolves the issue.</p>

        <div class="d-flex align-center justify-space-between mt-4 mb-2">
          <span class="text-subtitle-2">Server status:</span>
          <v-chip
            :color="statusColor"
            :prepend-icon="statusIcon"
            size="small"
          >
            {{ statusText }}
          </v-chip>
        </div>

        <v-alert
          v-if="galleryStore.proxyStatus === 'degraded'"
          type="warning"
          density="compact"
          class="mt-3"
        >
          Our server is experiencing some issues. It may still work, but results could be limited.
        </v-alert>

        <v-expansion-panels
          v-if="galleryStore.proxyStatusDetails"
          variant="accordion"
          class="mt-3"
        >
          <v-expansion-panel title="Technical details">
            <v-expansion-panel-text>
              <div class="text-caption text-medium-emphasis">
                <div>Rate Limiting (Firestore): {{ galleryStore.proxyStatusDetails.firestore === 'available' ? '✓ Active' : '✗ Unavailable' }}</div>
                <div>Reddit API: {{ galleryStore.proxyStatusDetails.reddit === 'available' ? '✓ Reachable' : '✗ Unreachable' }}</div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
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
  if (isOpen) {
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
    case 'operational': return 'Available'
    case 'degraded': return 'Limited'
    case 'unavailable': return 'Unavailable'
    case 'checking': return 'Checking...'
    default: return 'Unknown'
  }
})
</script>
