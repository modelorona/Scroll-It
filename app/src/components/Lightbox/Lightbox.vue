<template>
    <div>
        <v-container>
            <!--        insert play button -->
            <v-btn type="primary" @click="$emit('show-slideshow')">
                Start Slideshow
            </v-btn>

        </v-container>
        <FsLightbox id="lightbox" ref="lightbox"
                    :toggler="toggler" type="image"
                    :sources="posts.map(v => v.src)"
                    :key="this.$props.index"
        >
        </FsLightbox>

<!--        <v-overlay dark absolute :value="toggler" :opacity=".90">-->
<!--            -->
<!--            -->
<!--            -->
<!--            <v-btn-->
<!--                color="primary"-->
<!--                @click="toggler = false"-->
<!--            >-->
<!--                Hide Overlay-->
<!--            </v-btn>-->
<!--        </v-overlay>-->

    </div>
</template>

<script>
    import FsLightbox from 'fslightbox-vue';

    export default {
        name: "Lightbox",

        components: {
            FsLightbox
        },

        props: {
            posts: {
                type: Array,
                required: true
            },
            index: {
                type: Number,
                required: true
            }
        },

        data: () => ({
            toggler: false,
            galleryPlaying: false,
            observer: null
        }),

        computed: {
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
                iconDiv.addEventListener('click', function (event) {
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
            },
        },

        // beforeDestroy() {
        //     if (this.observer !== null) {
        //         console.log('removing observer...')
        //         this.observer.disconnect();
        //     }
        // },

        methods: {
            drawToolbar() {
                this.$nextTick(() => {
                    let toolbar = document.getElementsByClassName('fslightbox-toolbar').item(0);
                    toolbar.insertBefore(this.playPauseIcon, toolbar.firstChild);
                });
            },
            currentElement() {
                this.$nextTick(() => {
                    let navbar = document.getElementsByClassName('fslightbox-slide-number-container').item(0);
                    let spans = navbar.getElementsByTagName("span");
                    // this.currentNum = Number.parseInt(spans[0].innerHTML);
                    // this.lastNum = Number.parseInt(spans[2].innerHTML);

                    if (this.observer === null) {
                        console.log('adding observer...')
                        let observer = new MutationObserver(() => {
                            const lastNum = Number.parseInt(document.getElementsByClassName('fslightbox-slide-number-container').item(0)
                                .getElementsByTagName("span")[2].innerHTML);

                            const currentNum = Number.parseInt(document.getElementsByClassName('fslightbox-slide-number-container').item(0)
                                .getElementsByTagName("span")[0].innerHTML);

                            console.log(lastNum);
                            console.log(currentNum);

                            if ((lastNum - currentNum) === 2) {
                                console.log('here')
                                this.$emit('update-page');
                            }

                        });

                        observer.observe(spans[0], {subtree: true, childList: true, characterData: true});
                        this.observer = observer;
                    }
                });
            },
            showSlideshow() {
                this.toggler = !this.toggler;
                // this.drawToolbar();
                // this.currentElement();
            },
        }
    }
</script>

<style scoped>

</style>
