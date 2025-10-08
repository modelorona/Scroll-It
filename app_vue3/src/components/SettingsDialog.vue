<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>Settings</v-card-title>
      <v-card-text>
        <v-slider
          v-model="settingsStore.slideshowInterval"
          label="Slideshow Interval (seconds)"
          thumb-label
          :min="1"
          :max="30"
          :step="1"
        ></v-slider>
        <div class="text-center">{{ settingsStore.slideshowInterval }} seconds</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="dialog = false">Close</v-btn>
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
