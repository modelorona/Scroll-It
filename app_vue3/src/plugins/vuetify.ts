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

/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  ssr: true,
  theme: {
    defaultTheme: localStorage.getItem('theme') || 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#5C9DFF',
          secondary: '#7C4DFF',
          accent: '#FF6D00',
          error: '#FF5252',
          warning: '#FFC107',
          info: '#2196F3',
          success: '#4CAF50',
          background: '#121212',
          surface: '#1E1E1E',
        },
      },
      light: {
        dark: false,
        colors: {
          primary: '#1565C0',
          secondary: '#5E35B1',
          accent: '#FF6D00',
          error: '#D32F2F',
          warning: '#F9A825',
          info: '#1976D2',
          success: '#388E3C',
          background: '#F5F5F5',
          surface: '#FFFFFF',
        },
      },
    },
  },
})
