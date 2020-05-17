<template>
    <div>
        <Searchbar @getSubreddit="getSubreddit"></Searchbar>

        <Lightbox :posts="this.posts"></Lightbox>

        <ImageGallery :posts="this.posts"></ImageGallery>

    </div>
</template>

<script>
    import Searchbar from "./Searchbar/Searchbar";
    import Lightbox from "./Lightbox/Lightbox";
    import ImageGallery from "./ImageGallery/ImageGallery";
    import { getSubredditWithParams } from "../api/reddit";

    export default {
        name: 'Index',
        components: {ImageGallery, Searchbar, Lightbox},
        data: () => ({
            posts: [
                {title: 'Test title', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg', flex: 6},
                {title: 'Test title2', src: 'https://cdn.eso.org/images/thumb300y/eso1907a.jpg', flex: 6},
                {title: 'Test title3', src: 'https://media3.s-nbcnews.com/j/newscms/2019_41/3047866/191010-japan-stalker-mc-1121_06b4c20bbf96a51dc8663f334404a899.fit-760w.JPG', flex: 6},
                {title: 'Test title4', src: 'https://thumbs-prod.si-cdn.com/tJgHlc1OgfZ1saGEq5xGVNQgoMA=/420x240/https://public-media.si-cdn.com/filer/90/b2/90b2dfe5-a9ab-4821-9ccc-45ae1d52fa8a/blackholewithclouds_c-1-941x519.jpg', flex: 6}
            ],
        }),

        methods: {
            getSubreddit(text, postType, nsfw) {
                getSubredditWithParams(text, postType, nsfw);
            },
        }
    }
</script>
