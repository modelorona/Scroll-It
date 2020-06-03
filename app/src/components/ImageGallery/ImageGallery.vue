<template>
    <div>
        <v-container>
            <v-btn type="primary" @click="startSlideshow">
                Start Slideshow
            </v-btn>
        </v-container>

        <v-container fluid>

            <v-row dense :align-content="'center'" :justify="'center'">
                <v-col v-for="(post, index) in this.$props.posts" :key="$id(post.src + index)" md="4" lg="4" sm="8" :align-self="'center'">
                    <v-card @click="enlargePhoto(post)">
                        <v-img :src="post.src" :alt="post.alt"></v-img>
                    </v-card>
                </v-col>
            </v-row>

<!--            todo: look into using some other way of doing this, the overlay is not the best way, and keyboard controls are a hassle-->
            <v-overlay v-on:click.native="closeOverlay($event)" v-esc="()=>this.overlay=false"
                       :opacity="opacity"
                       :value="overlay"
                       :z-index="zIndex">

                <v-row :align-content="'center'" :justify="'center'">

                    <v-col class="flex-grow-1">
                        <v-img :src="currentImageSrc" :max-height="getMaxHeight()" :max-width="getMaxWidth()"
                               height="85vh" width="100vh" contain class="overlay_image" ref="overlay_image"
                               :alt="currentImageAlt">
                        </v-img>
                    </v-col>

                </v-row>
                <v-row align="center"
                       justify="center">
                    <v-btn-toggle
                        v-model="selectedBottomBarButton" dense dark tile active-class="primary"
                        background-color="primary"
                        @change="handleButtonPress"
                    >
                        <v-btn :value="'close'" ripple>
                            <span>Close</span>
                            <v-icon>mdi-close</v-icon>
                        </v-btn>

                        <v-btn v-if="slideshowEnabled && showPlayPause" :value="'disable-slideshow'">
                            <span>Pause</span>
                            <v-icon>mdi-pause</v-icon>
                        </v-btn>

                        <v-btn v-else-if="!slideshowEnabled && showPlayPause" :value="'enable-slideshow'">
                            <span>Play </span>
                            <v-icon>mdi-play</v-icon>
                        </v-btn>

                        <v-btn :value="'open-thread'" ripple :href="currentImagePostUrl" target="_blank" ref="open-thread-btn">
                            <span>Open</span>
                            <v-icon>mdi-open-in-new</v-icon>
                        </v-btn>
                    </v-btn-toggle>
                </v-row>

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

        data: () => ({
            absolute: false,
            opacity: 0.99,
            zIndex: 5,
            overlay: false,
            currentImage: {src: '', alt: '', postUrl: ''},
            slideshowEnabled: false,
            intervalId: null,
            selectedBottomBarButton: null,
            showPlayPause: false,
            timeOut: 5000,
        }),

        watch: {
            overlay: {
                handler: function (val, oldVal) {
                    if (val === false) {
                        this.showPlayPause = false;
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
            },
            currentImagePostUrl() {
                return this.currentImage.postUrl;
            }
        },

        methods: {
            handleButtonPress() {
                if (this.selectedBottomBarButton === 'close') {
                    this.overlay = false;
                    this.slideshowEnabled = false;
                } else if (this.selectedBottomBarButton === 'disable-slideshow') {
                    this.slideshowEnabled = false;
                } else if (this.selectedBottomBarButton === 'enable-slideshow') {
                    this.slideshowEnabled = true;
                } else if (this.selectedBottomBarButton === 'open-thread') {
                    this.$refs['open-thread-btn'].$el.classList.remove('v-item--active');
                }
                this.selectedBottomBarButton = null;
            },
            startSlideshow() {
                // sets the img src to the first one in posts, and starts a timer to automatically switch
                if (this.$props.posts.length !== 0) {
                    this.showPlayPause = true;
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
                }, this.timeOut);
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
                // maybe hacky way to do this
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
        }

    }
</script>

<style>

</style>
