// stores/settings.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // Load the initial value from localStorage, defaulting to 5 seconds.
  const savedInterval = localStorage.getItem('slideshowInterval')
  const slideshowInterval = ref(savedInterval ? parseInt(savedInterval, 10) : 5)

  // Watch for changes and save to localStorage.
  watch(slideshowInterval, (newValue) => {
    localStorage.setItem('slideshowInterval', newValue.toString())
  }, { deep: true })

  return {
    slideshowInterval,
  }
})
