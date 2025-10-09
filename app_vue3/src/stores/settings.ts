// stores/settings.ts
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    slideshowInterval: parseInt(localStorage.getItem('slideshowInterval') || '5'),
    lastVisitedSubreddit: localStorage.getItem('lastVisitedSubreddit') || '',
    sortOption: localStorage.getItem('sortOption') || 'hot',
    agreedToNSFW: localStorage.getItem('agreedToNSFW') === 'true',
    useProxy: sessionStorage.getItem('useProxy') === 'true',
  }),
  actions: {
    setSlideshowInterval(interval: number) {
      this.slideshowInterval = interval;
      localStorage.setItem('slideshowInterval', interval.toString());
    },
    setLastVisitedSubreddit(subreddit: string) {
      this.lastVisitedSubreddit = subreddit;
      localStorage.setItem('lastVisitedSubreddit', subreddit);
    },
    setSortOption(option: string) {
      this.sortOption = option;
      localStorage.setItem('sortOption', option);
    },
    setAgreedToNSFW(value: boolean) {
      this.agreedToNSFW = value;
      localStorage.setItem('agreedToNSFW', value.toString());
    },
    setUseProxy(value: boolean) {
      this.useProxy = value;
      sessionStorage.setItem('useProxy', value.toString());
    },
  },
});
