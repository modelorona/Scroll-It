<template>
<!--    adapted from https://github.com/vuetifyjs/vuetify/blob/master/packages/docs/src/pages/general/404.vue-->
    <v-container
        class="text-center"
        fill-height
        style="height: calc(100vh - 58px);"
    >
        <v-row align="center">
            <v-col>
                <h1 class="display-2 primary--text">Whoops, 404</h1>

                <p>The page you were looking for does not exist</p>

                <v-btn
                    :to="`/`"
                    color="primary"

                >
                    Go home
                </v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    export default {
        name: "NotFound"
    }
</script>

<style scoped>

</style>
