// stores/settings.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    slideshowInterval: parseInt(localStorage.getItem('slideshowInterval') || '5'),
  }),
  actions: {
    setSlideshowInterval(interval: number) {
      this.slideshowInterval = interval;
      localStorage.setItem('slideshowInterval', interval.toString());
    },
  },
});
