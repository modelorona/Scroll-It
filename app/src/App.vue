<template>
  <v-app>
    <v-app-bar
      app
      type="primary"
      dark dense
    >
      <div class="d-flex align-center">
        <v-img
          alt="Vuetify Logo"
          class="shrink mr-2"
          contain
          src="./assets/logo.png"
          transition="scale-transition"
          width="40"
        />

        <v-img
          alt="Vuetify Name"
          class="shrink mt-1 hidden-sm-and-down"
          contain
          min-width="100"
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
          width="100"
        />
      </div>

      <v-spacer></v-spacer>
      <v-spacer></v-spacer>
    </v-app-bar>

    <v-content>
      <Index/>
    </v-content>
  </v-app>
</template>

<script>
import Index from './components/Index'

export default {
  name: 'App',

  components: {
    Index
  },

  data: () => ({
    //
  })
}
</script>
