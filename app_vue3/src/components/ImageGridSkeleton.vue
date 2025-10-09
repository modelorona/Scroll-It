<template>
  <v-container fluid>
    <v-row>
      <v-col
        v-for="n in 12"
        :key="n"
        cols="12"
        md="3"
      >
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
//
</script>
