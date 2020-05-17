<template>
    <div>
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
            }
        },

        data: () => ({
            toggler: false,
            index: 0,
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
            drawToolbar() {
                this.$nextTick(() => {
                    let toolbar = document.getElementsByClassName('fslightbox-toolbar').item(0);
                    toolbar.insertBefore(this.playPauseIcon, toolbar.firstChild);
                })
            },
            showSlideshow() {
                this.toggler = !this.toggler;
                this.drawToolbar();
            },
        }
    }
</script>

<style scoped>

</style>
