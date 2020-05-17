<template>
    <div>
        <v-container>
            <v-row :align-content="'center'" :justify="'center'">
                <v-col cols="8">
                    <v-text-field outlined :label="this.label" filled v-model="text" dense
                                  clear-icon="mdi-close-circle" clearable class="ml-1 mr-1"
                                  type="text" @click:clear="clearText" :hint="this.label + ' that you wish to search for.'"
                    ></v-text-field>
                </v-col>
                <v-col cols="4">
                    <v-menu v-model="menu" :close-on-content-click="false">

                        <template v-slot:activator="{ on }">
                            <v-btn icon large ripple small type="button" v-on="on">
                                <v-icon>mdi-wrench</v-icon>
                            </v-btn>
                        </template>
                        <v-card>
                            <v-list>
                                <v-list-item>
                                    <v-list-item-action>
                                        <v-switch v-model="nsfw" color="green"></v-switch>
                                    </v-list-item-action>
                                    <v-list-item-title>Show NSFW Content</v-list-item-title>
                                </v-list-item>
                            </v-list>
                            <v-select
                                :items="postTypeOptions"
                                filled v-model="postType"
                                label="Choose post type"
                            ></v-select>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color="primary" text @click="menu = false">Save</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-menu>
                    <v-btn icon large ripple type="submit" @click="getSubreddit">
                        <v-icon>mdi-send</v-icon>
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>

        <v-container>
        <!--        insert play button -->
        <v-btn type="primary" @click="showSlideshow">
            Play Slideshow
        </v-btn>

        </v-container>

        <FsLightbox id="lightbox"
            :toggler="toggler" type="image"
            :sources="posts.map(v => v.src)"
            :key="index"
        >
        </FsLightbox>

        <v-container fluid>
            <v-row dense :align-content="'center'" :justify="'center'">
                <v-col v-for="post in posts" :key="post.title" md="4" lg="4" sm="8" :align-self="'center'">
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


    </div>
</template>

<script>
    import snoowrap from 'snoowrap';
    import FsLightbox from 'fslightbox-vue';

    export default {
        name: 'Index',
        components: {FsLightbox},
        data: () => ({
            absolute: false,
            opacity: 0.99,
            zIndex: 5,
            overlay: false,
            currentImage: '',
            toggler: false,
            index: 0,
            posts: [
                {title: 'Test title', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg', flex: 6},
                {title: 'Test title2', src: 'https://cdn.eso.org/images/thumb300y/eso1907a.jpg', flex: 6},
                {title: 'Test title3', src: 'https://media3.s-nbcnews.com/j/newscms/2019_41/3047866/191010-japan-stalker-mc-1121_06b4c20bbf96a51dc8663f334404a899.fit-760w.JPG', flex: 6},
                {title: 'Test title4', src: 'https://thumbs-prod.si-cdn.com/tJgHlc1OgfZ1saGEq5xGVNQgoMA=/420x240/https://public-media.si-cdn.com/filer/90/b2/90b2dfe5-a9ab-4821-9ccc-45ae1d52fa8a/blackholewithclouds_c-1-941x519.jpg', flex: 6}
            ],
            label: 'Enter subreddit name',
            text: '',
            menu: false,
            nsfw: false,
            postTypeOptions: ['Hot', 'New', 'Top'],
            postType: 'Hot',
            r: new snoowrap({
                userAgent: process.env.VUE_APP_USER_AGENT,
                clientId: process.env.VUE_APP_CLIENT_ID,
                clientSecret: process.env.VUE_APP_CLIENT_SECRET,
                refreshToken: process.env.VUE_APP_REFRESH_TOKEN
            }),
            galleryPlaying: false,
        }),

        computed: {
            fullscreenIcon() {
                let iconDiv = document.createElement('div');
                iconDiv.classList.add('fslightbox-toolbar-button', 'fslightbox-flex-centered');
                iconDiv.title = 'Enter fullscreen';

                let iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                iconSvg.setAttribute('viewBox', '0 0 18 18');
                iconSvg.setAttribute('width', '20px');
                iconSvg.setAttribute('height', '20px');

                let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M4.5 11H3v4h4v-1.5H4.5V11zM3 7h1.5V4.5H7V3H3v4zm10.5 6.5H11V15h4v-4h-1.5v2.5zM11 3v1.5h2.5V7H15V3h-4z');
                path.classList.add('fslightbox-svg-path');

                iconDiv.addEventListener('click', function(event) {
                    if (document.fullscreenEnabled) {
                        if (document.fullscreenElement === null) {
                            // request fullscreen
                            const documentElement = document.documentElement;
                            if (documentElement.requestFullscreen) {
                                documentElement.requestFullscreen();
                            } else if (documentElement.mozRequestFullScreen) {
                                documentElement.mozRequestFullScreen();
                            } else if (documentElement.webkitRequestFullscreen) {
                                documentElement.webkitRequestFullscreen();
                            } else if (documentElement.msRequestFullscreen) {
                                documentElement.msRequestFullscreen();
                            }
                            this.title = 'Exit Fullscreen';
                            let pathElement = this.getElementsByClassName('fslightbox-svg-path').item(0);
                            let svgElement = this.childNodes.item(0);

                            svgElement.setAttribute('viewBox', '0 0 950 1024');
                            svgElement.setAttribute('width', '24px');
                            svgElement.setAttribute('height', '24px');
                            pathElement.setAttribute('d', 'M682 342h128v84h-212v-212h84v128zM598 810v-212h212v84h-128v128h-84zM342 342v-128h84v212h-212v-84h128zM214 682v-84h212v212h-84v-128h-128z');
                        } else {
                            // close fullscreen
                            if (document.exitFullscreen) {
                                document.exitFullscreen();
                            } else if (document.mozCancelFullScreen) {
                                document.mozCancelFullScreen();
                            } else if (document.webkitExitFullscreen) {
                                document.webkitExitFullscreen();
                            } else if (document.msExitFullscreen) {
                                document.msExitFullscreen();
                            }
                            this.title = 'Enter Fullscreen';
                            let pathElement = this.getElementsByClassName('fslightbox-svg-path').item(0);
                            let svgElement = this.childNodes.item(0);

                            svgElement.setAttribute('viewBox', '0 0 18 18');
                            svgElement.setAttribute('width', '20px');
                            svgElement.setAttribute('height', '20px');
                            pathElement.setAttribute('d', 'M4.5 11H3v4h4v-1.5H4.5V11zM3 7h1.5V4.5H7V3H3v4zm10.5 6.5H11V15h4v-4h-1.5v2.5zM11 3v1.5h2.5V7H15V3h-4z');
                        }
                    }
                }, false);

                iconSvg.appendChild(path);
                iconDiv.appendChild(iconSvg);

                return iconDiv;
            },
            playPauseIcon() {
                let iconDiv = document.createElement('div');
                iconDiv.classList.add('fslightbox-toolbar-button', 'fslightbox-flex-centered');
                iconDiv.title = 'Turn on auto scroll';

                let iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                iconSvg.setAttribute('viewBox', '0 0 30 30');
                iconSvg.setAttribute('width', '16px');
                iconSvg.setAttribute('height', '16px');

                let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M 6 3 A 1 1 0 0 0 5 4 A 1 1 0 0 0 5 4.0039062 L 5 15 L 5 25.996094 A 1 1 0 0 0 5 26 A 1 1 0 0 0 6 27 A 1 1 0 0 0 6.5800781 26.8125 L 6.5820312 26.814453 L 26.416016 15.908203 A 1 1 0 0 0 27 15 A 1 1 0 0 0 26.388672 14.078125 L 6.5820312 3.1855469 L 6.5800781 3.1855469 A 1 1 0 0 0 6 3 z');
                path.classList.add('fslightbox-svg-path');

                let g = this.galleryPlaying;
                iconDiv.addEventListener('click', function(event) {
                        if (!g) {
                            this.title = 'Turn off auto scroll';
                            let pathElement = this.getElementsByClassName('fslightbox-svg-path').item(0);
                            let svgElement = this.childNodes.item(0);

                            svgElement.setAttribute('viewBox', '0 0 356.19 356.19');
                            svgElement.setAttribute('width', '14px');
                            svgElement.setAttribute('height', '14px');
                            pathElement.setAttribute('d', 'M121,0c18,0,33,15,33,33v372c0,18-15,33-33,33s-32-15-32-33V33C89,15,103,0,121,0zM317,0c18,0,32,15,32,33v372c0,18-14,33-32,33s-33-15-33-33V33C284,15,299,0,317,0z');
                        } else {

                            this.title = 'Turn on auto scroll';
                            let pathElement = this.getElementsByClassName('fslightbox-svg-path').item(0);
                            let svgElement = this.childNodes.item(0);

                            svgElement.setAttribute('viewBox', '0 0 30 30');
                            svgElement.setAttribute('width', '16px');
                            svgElement.setAttribute('height', '16px');
                            pathElement.setAttribute('d', 'M 6 3 A 1 1 0 0 0 5 4 A 1 1 0 0 0 5 4.0039062 L 5 15 L 5 25.996094 A 1 1 0 0 0 5 26 A 1 1 0 0 0 6 27 A 1 1 0 0 0 6.5800781 26.8125 L 6.5820312 26.814453 L 26.416016 15.908203 A 1 1 0 0 0 27 15 A 1 1 0 0 0 26.388672 14.078125 L 6.5820312 3.1855469 L 6.5800781 3.1855469 A 1 1 0 0 0 6 3 z');
                        }
                        g = !g;
                }, false);

                iconSvg.appendChild(path);
                iconDiv.appendChild(iconSvg);

                return iconDiv;
            }
        },

        methods: {
            test(evt) {
                console.log(evt);
            },
            drawToolbar() {
                this.$nextTick(() => {
                    let toolbar = document.getElementsByClassName('fslightbox-toolbar').item(0);
                    // toolbar.replaceChild(this.fullscreenIcon, toolbar.childNodes.item(0));
                    toolbar.insertBefore(this.playPauseIcon, toolbar.firstChild);
                })
            },
            closeOverlay(evt) {
                // maybe hacky way to do this
                const classname = evt.path[0].className;
                if (classname === 'v-overlay__scrim') {
                    this.overlay = false;
                }
            },
            showSlideshow() {
                this.toggler = !this.toggler;
                this.drawToolbar();
            },
            enlargePhoto(evt) {
                this.currentImage = evt.src;
                this.overlay = true;
            },
            getSubreddit() {
                this.r.getSubreddit(this.text).getNew().then(content => console.log(content));
            },
            clearText() {
                this.text = '';
            }
        }
    }
</script>
