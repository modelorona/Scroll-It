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
    max-width="500px"
  >
    <v-card>
      <v-card-title>Settings</v-card-title>
      <v-card-text>
        <v-slider
          v-model="settingsStore.slideshowInterval"
          label="Slideshow Interval (seconds)"
          min="1"
          max="30"
          step="1"
          thumb-label
          hint="The time between slides in the slideshow."
          persistent-hint
          @update:model-value="settingsStore.setSlideshowInterval"
        />        <div class="text-center">
          {{ settingsStore.slideshowInterval }} seconds
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          variant="text"
          @click="dialog = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue'])

const settingsStore = useSettingsStore()
const dialog = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  dialog.value = newValue
})

watch(dialog, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>
