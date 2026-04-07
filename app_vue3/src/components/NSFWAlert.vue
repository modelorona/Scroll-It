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
  <v-row class="cols">
    <v-alert
      v-model="isOpen"
      density="compact"
      icon="mdi-alert-octagon"
      prominent
      text
      type="warning"
    >
      <v-row align="center">
        <v-col class="grow">
          Your search returned some NSFW (Not Safe For Work) content. Would you like to see this content?
        </v-col>
      </v-row>
      <template #append>
        <v-btn
          icon
          size="small"
          @click="decline"
        >
          <v-icon>mdi-cancel</v-icon>
        </v-btn>
        {{ }}
        <v-btn
          icon
          size="small"
          @click="accept"
        >
          <v-icon>mdi-check</v-icon>
        </v-btn>
      </template>
    </v-alert>
  </v-row>
</template>

  <script setup>
  import { ref, watch } from 'vue'

  const props = defineProps({
    isOpen: Boolean,
  })

  const emit = defineEmits(['update:isOpen', 'accept', 'decline'])

  const isOpen = ref(props.isOpen)

  watch(() => props.isOpen, newValue => {
    isOpen.value = newValue
  })

  watch(isOpen, newValue => {
    emit('update:isOpen', newValue)
  })

  const accept = () => {
    isOpen.value = false
    emit('accept')
  }

  const decline = () => {
    isOpen.value = false
    emit('decline')
  }
  </script>
