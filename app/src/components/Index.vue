<template>
    <div>
        <Searchbar @getSubreddit="getSubreddit"></Searchbar>

        <v-alert v-model="this.alert"
                 icon="mdi-alert-octagon"
                 prominent border="left"
                 text dense
                 type="info"
        >
            <v-row align="center">
                <v-col class="grow"> Your search returned some NSFW (Not Safe For Work) content. Would you like to see this content?</v-col>
                <v-col class="shrink">
                    <v-btn icon small ripple type="button" color="black" @click="showContent(false)">
                        <v-icon>mdi-cancel</v-icon>
                    </v-btn>
                </v-col>
                <v-col class="shrink">
                    <v-btn icon small ripple type="button" color="black" @click="showContent(true)">
                        <v-icon>mdi-check</v-icon>
                    </v-btn>
                </v-col>
            </v-row>
        </v-alert>

        <Lightbox :posts="this.posts" :index="index"></Lightbox>

        <ImageGallery :posts="this.posts"></ImageGallery>

        <v-snackbar
            v-model="snackbar" top
            :color="'error'"
            :multi-line="'multi-line'"
            :timeout="6000"
        >
            This subreddit is either down or does not exist. Please try again.
            <v-btn
                dark
                text
                @click="snackbar = false"
            >
                Close
            </v-btn>
        </v-snackbar>

    </div>
</template>

<script>
    import Searchbar from "./Searchbar/Searchbar";
    import Lightbox from "./Lightbox/Lightbox";
    import ImageGallery from "./ImageGallery/ImageGallery";
    import {getSubredditWithParams} from "../api/reddit";

    export default {
        name: 'Index',
        components: {ImageGallery, Searchbar, Lightbox},
        data: () => ({
            snackbar: false,
            alert: false,
            httpResult: null,
            limit: 20,
            after: '',
            posts: [],
            index: 0,
            textContent: '', // for being able to get new content
            postType: '' // for new content
        }),

        methods: {
            showContent(showNsfw) {
                this.alert = false;
                if (this.httpResult !== null) {
                    let newPosts = JSON.parse(JSON.stringify(this.httpResult));
                    // remove all textual posts
                    newPosts = newPosts.filter(item => item.post_hint === 'image' && item.is_self === false);

                    // not sure how best to do this below
                    let nsfwPosts = newPosts.filter(item => item.over_18 === true);
                    let nonNsfwPosts = newPosts.filter(item => item.over_18 !== true);

                    let toAdd = [];
                    if (showNsfw) {
                        toAdd.push(...nsfwPosts);
                    }
                    toAdd.push(...nonNsfwPosts);

                    const cleanToAdd = [];
                    toAdd.forEach(item => cleanToAdd.push({
                        title: item.title,
                        alt: `Reddit post with title: ${item.title}`,
                        src: item.url,
                    }));

                    this.after = `t3_${newPosts[newPosts.length - 1].id}`;
                    this.posts.push(...cleanToAdd);
                    this.index++;
                }
            },
            getSubreddit(text, postType, newSearch) {
                this.textContent = text;
                this.postType = postType;
                if (newSearch) {
                    this.posts = [];
                }
                getSubredditWithParams(text, postType, this.limit, '')
                    .then(result => {
                        let nsfwContentReturned = result.find(item => item.over_18 === true) !== undefined;
                        this.httpResult = result;
                        if (nsfwContentReturned) {
                            this.alert = true;
                        }
                    })
                    .catch(error => {
                        this.httpResult = null;
                        this.snackbar = true;
                    });
            },
            updateContent() {
                // don't like how this is done
                getSubredditWithParams(this.textContent, this.postType, this.limit, this.after)
                    .then(result => {
                        this.httpResult = result;
                        // remember if user agreed to nsfw here
                        this.showContent(true)
                    })
                    .catch(error => {
                        // silently ignore this one for now
                    })
            },
        }
    }
</script>
