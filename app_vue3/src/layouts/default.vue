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
  <v-app>
    <v-app-bar :elevation="5">
      <v-app-bar-title>
        <div
          class="d-flex align-center"
          style="cursor: pointer;"
          @click="handleLogoClick"
        >
          <v-img
            alt="Scroll-It"
            class="shrink mr-2"
            cover
            max-width="50"
            src="@/assets/logo-white.png"
            transition="scale-transition"
          />
          <v-img
            alt="Scroll-It"
            class="shrink mt-1"
            cover
            max-width="100"
            src="@/assets/navbar.png"
          />
        </div>
      </v-app-bar-title>

      <v-btn @click="settingsDialog = true">
        <v-icon size="large">
          mdi-cog
        </v-icon>
      </v-btn>

      <v-dialog max-width="500">
        <template #activator="{ props: activatorProps }">
          <v-btn v-bind="activatorProps">
            <v-icon size="large">
              mdi-information
            </v-icon>
          </v-btn>
        </template>

        <template #default="{ isActive }">
          <v-card>
            <v-card-title
              class="text-h5 bg-grey-lighten-2"
              primary-title
            >
              What is this?
            </v-card-title>

            <v-card-text>
              This is a small side project made during the Lockdown of 2020. I wanted to take the time to learn more about Vue.js and Vuetify. I was inspired by <a
                href="http://www.imagoid.com/"
                target="_blank"
              >Imagoid</a>
              and so created a very simple auto scroller for Reddit image posts. I hope you enjoy, and if you find any issues you can leave an issue in the source code repository!
              <v-icon>mdi-emoticon-happy</v-icon>

              <br><br>
              You can find me on <a
                href="https://www.linkedin.com/in/ahristozov/"
                target="_blank"
              >LinkedIn</a> for any further questions or inquiries. Stay safe!

              <br><br>
              All content belongs to Reddit and the users that uploaded it. I take no responsibility for what is displayed or searched.
            </v-card-text>

            <v-divider />
            <br>
            <v-card-text>
              Privacy policy: This site collects no analytics or any other identifiable data.
              <br>
              Cookie policy: This site sets no cookies.
            </v-card-text>

            <v-divider />

            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                href="https://github.com/modelorona/Scroll-It"
                target="_blank"
              >
                See source code
              </v-btn>
              <v-btn
                color="primary"
                @click="isActive.value = false"
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
    <SettingsDialog v-model="settingsDialog" />
    <AppFooter />
  </v-app>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import SettingsDialog from '@/components/SettingsDialog.vue'
  import { useGalleryStore } from '@/stores/gallery'

  const router = useRouter()
  const settingsDialog = ref(false)
  const galleryStore = useGalleryStore()

  function handleLogoClick() {
    galleryStore.resetSearch()
    router.push('/')
  }
</script>
