<template>
    <v-container fluid>
        <v-row dense :align-content="'center'" :justify="'center'">
            <v-col v-for="post in this.$props.posts" :key="post.title" md="4" lg="4" sm="8" :align-self="'center'">
                <v-card @click="enlargePhoto(post)">
                    <v-img :src="post.src" :alt="'Change this later on'" :key="post.src"></v-img>
                </v-card>
            </v-col>
        </v-row>

        <v-overlay v-on:click.native="closeOverlay($event)" v-esc="()=>this.overlay=false"
                   :absolute="absolute"
                   :opacity="opacity"
                   :value="overlay"
                   :z-index="zIndex">

            <v-icon @click="overlay=false" class="float-right">mdi-close</v-icon>
            <v-img :src="currentImage" :height="'100%'" :width="'100%'"></v-img>

        </v-overlay>
    </v-container>
</template>

<script>
    export default {
        name: "ImageGallery",

        props: {
            posts: {
                type: Array,
                required: true
            }
        },

        data: () => ({
            absolute: false,
            opacity: 0.99,
            zIndex: 5,
            overlay: false,
            currentImage: '',
        }),

        methods: {
            enlargePhoto(evt) {
                this.currentImage = evt.src;
                this.overlay = true;
            },
            closeOverlay(evt) {
                // maybe hacky way to do this
                const classname = evt.path[0].className;
                if (classname === 'v-overlay__scrim') {
                    this.overlay = false;
                }
            }
        }
    }
</script>

<style scoped>

</style>
