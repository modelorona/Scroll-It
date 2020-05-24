<template>
    <div>
        <v-container>
            <v-btn type="primary" @click="startSlideshow">
                Start Slideshow
            </v-btn>
        </v-container>

        <v-container fluid>

            <v-row dense :align-content="'center'" :justify="'center'">
                <v-col v-for="post in this.$props.posts" :key="post.title" md="4" lg="4" sm="8" :align-self="'center'">
                    <v-card @click="enlargePhoto(post)">
                        <v-img :src="post.src" :alt="'Change this later on'" :key="post.src"></v-img>
                    </v-card>
                </v-col>
            </v-row>

            <v-overlay v-on:click.native="closeOverlay($event)" v-esc="()=>this.overlay=false"
                       :opacity="opacity"
                       :value="overlay"
                       :z-index="zIndex">

                <v-row :align-content="'center'" :justify="'center'">

                    <v-col class="flex-grow-1">
                        <v-img :src="currentImageSrc" :max-height="getMaxHeight()" :max-width="getMaxWidth()"
                               height="100vh" width="100vh" contain class="overlay_image" ref="overlay_image"
                               :alt="currentImageAlt">
                            <template v-slot:placeholder>
                                <v-row
                                    class="fill-height ma-0"
                                    align="center"
                                    justify="center"
                                >
                                    <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
                                </v-row>
                            </template>
                        </v-img>
                    </v-col>

                </v-row>

                <v-icon icon v-if="slideshowEnabled" class="float my-float elevation-20" ref="play_pause_button" @click="slideshowEnabled=false">mdi-pause</v-icon>
                <v-icon icon v-else class="float my-float elevation-20" ref="play_pause_button" @click="slideshowEnabled=true">mdi-play</v-icon>

            </v-overlay>
        </v-container>
    </div>
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

        watch: {
            overlay: {
                handler: function (val, oldVal) {
                    if (val === false) {
                        clearInterval(this.intervalId);
                    }
                }
            }
        },

        computed: {
            currentImageSrc() {
                return this.currentImage.src;
            },
            currentImageAlt() {
                return this.currentImage.alt;
            }
        },

        methods: {
            startSlideshow() {
                // sets the img src to the first one in posts, and starts a timer to automatically switch
                if (this.$props.posts.length !== 0) {
                    this.enlargePhoto(this.$props.posts[0]);
                    this.slideshowEnabled = true;
                    this.startInterval();
                }
            },
            startInterval() {
                this.intervalId = setInterval(() => {
                    if (this.slideshowEnabled) {
                        let currentPos = this.$props.posts.indexOf(this.currentImage);
                        if (this.$props.posts.length - currentPos === 3) {
                            this.updatePage(); // get more posts in the background
                        }
                        if (this.$props.posts.length - 1 > currentPos) {
                            this.currentImage = this.$props.posts[++currentPos];
                        } // do not go to next if there is nothing to go to
                    }
                }, 2000);
            },
            updatePage() {
                this.$emit('update-page');
            },
            scroll() {
                window.onscroll = () => {
                    let winBottom = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) + window.innerHeight
                        === document.documentElement.offsetHeight;

                    if (winBottom) {
                        this.updatePage();
                    }
                }
            },
            enlargePhoto(post) {
                this.currentImage = post;
                this.overlay = true;
            },
            closeOverlay(evt) {
                // maybe hacky way to do this todo: fix
                // console.log(evt)
                const classname = evt.path[0].className;
                if (classname === 'v-overlay__scrim') {
                    this.overlay = false;
                }
            },
            getMaxHeight() {
                return window.innerHeight;
            },
            getMaxWidth() {
                return window.innerWidth;
            },
        },

        mounted() {
            this.scroll();
        },

        data: () => ({
            absolute: false,
            opacity: 0.99,
            zIndex: 5,
            overlay: false,
            currentImage: {src: '', alt: ''},
            slideshowEnabled: false,
            intervalId: null
        }),

    }
</script>

<style scoped>

    .float {
        position: fixed;
        width: 60px;
        height: 60px;
        bottom: 20px;
        right: 20px;
        background-color: lightseagreen;
        color: #FFF;
        border-radius: 50px;
        text-align: center;
    }

    .my-float {
        margin-top: 22px;
    }
</style>
