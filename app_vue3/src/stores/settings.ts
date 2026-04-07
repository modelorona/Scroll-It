/*
 * Copyright 2025 modelorona
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// stores/settings.ts
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    slideshowInterval: parseInt(localStorage.getItem('slideshowInterval') || '5'),
    sortOption: localStorage.getItem('sortOption') || 'hot',
    agreedToNSFW: localStorage.getItem('agreedToNSFW') === 'true',
    useProxy: sessionStorage.getItem('useProxy') === 'true',
  }),
  actions: {
    setSlideshowInterval(interval: number) {
      this.slideshowInterval = interval;
      localStorage.setItem('slideshowInterval', interval.toString());
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
