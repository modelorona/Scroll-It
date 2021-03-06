<template>
    <div>
        <Searchbar @get-subreddit="getSubreddit"></Searchbar>

        <NsfwAlert :alert="this.nsfwAlert" @set-nsfw-choice="setNsfwChoice"></NsfwAlert>

        <ImageGallery :posts="this.posts" @update-page="updateContent"></ImageGallery>

        <v-snackbar
            v-model="errorSnackbar" top
            :color="'error'"
            :multi-line="'multi-line'"
            :timeout="6000"
        >
            This subreddit is down, does not exist, or an error occured when trying to fetch the images.
            Additionally, your browser might be blocking requests or external resources.
            Please try again or search for another one.
            <br/><br/>
            <v-btn
                dark
                text
                @click="errorSnackbar=false"
            >
                Close
            </v-btn>
        </v-snackbar>

        <v-snackbar
            v-model="infoSnackbar" top
            :color="'info'"
            :multi-line="'multi-line'"
            :timeout="6000"
        >
            Click on any image to view it by itself.
            <v-btn
                dark
                text
                @click="infoSnackbar=false"
            >
                Got it
            </v-btn>
        </v-snackbar>

        <v-snackbar
            v-model="nsfwSnackbar" top
            :color="'info'"
            :multi-line="'multi-line'"
            :timeout="6000"
        >
            Your NSFW choice will be remembered for the duration of the session.
            <v-btn
                dark
                text
                @click="nsfwSnackbar=false"
            >
                Got it
            </v-btn>
        </v-snackbar>

    </div>
</template>

<script>
    import Searchbar from "./Searchbar/Searchbar";
    import ImageGallery from "./ImageGallery/ImageGallery";
    import {getSubredditWithParams} from "../api/reddit";
    import NsfwAlert from "./NsfwAlert/NsfwAlert";

    export default {
        name: 'Index',
        components: {NsfwAlert, ImageGallery, Searchbar},
        data: () => ({
            errorSnackbar: false,
            nsfwSnackbar: false,
            infoSnackbar: false,
            nsfwAlert: false,
            result: null,
            limit: 20,
            after: '',
            posts: [],
            index: 0,
            textContent: '', // for being able to get new content
            postType: '', // for new content,
        }),

        watch: {
            $route: function (to, from) {
                if (to.name === 'index') {
                    this.posts = []; // reset if on home page
                }
                if (to.name === 'thread_view') {
                    this.getSubreddit(to.params.thread, to.query.type, true);
                }
            }
        },

        created() {
            if (this.$route.params.hasOwnProperty('thread')) {
                this.getSubreddit(this.$route.params.thread,
                    this.$route.query.type!==undefined?this.$route.query.type:'Hot', true)
            }
        },

        methods: {
            setNsfwChoice(val) {
                sessionStorage.setItem('nsfw_enabled', val.toString());
                this.showContent();
            },
            getNsfwChoice() {
                return JSON.parse(sessionStorage.getItem('nsfw_enabled'));
            },
            showContent() {
                this.nsfwAlert = false;
                if (this.result !== null) {
                    if (sessionStorage.getItem('info_snackbar_shown') === null) {
                        this.infoSnackbar = true;
                        sessionStorage.setItem('info_snackbar_shown', 'true');
                    } // else do not show the snackbar

                    let newPosts = JSON.parse(JSON.stringify(this.result));
                    // remove all textual posts
                    newPosts = newPosts.filter(item => item.post_hint === 'image' && item.is_self === false);

                    // not sure how best to do this below
                    let nsfwPosts = newPosts.filter(item => item.over_18 === true);
                    let nonNsfwPosts = newPosts.filter(item => item.over_18 !== true);

                    let toAdd = [];
                    if (this.getNsfwChoice()) {
                        toAdd.push(...nsfwPosts);
                    }
                    toAdd.push(...nonNsfwPosts);

                    const cleanToAdd = [];
                    toAdd.forEach(item => cleanToAdd.push({
                        title: item.title,
                        alt: `Reddit post with title: ${item.title}`,
                        src: item.url,
                        postUrl: `https://reddit.com${item.permalink}`
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
                        this.handleHttpResult(result)
                    })
                    .catch(error => {
                        this.result = null;
                        this.errorSnackbar = true;
                    });
            },
            updateContent() {
                getSubredditWithParams(this.textContent, this.postType, this.limit, this.after)
                    .then(result => {
                        this.handleHttpResult(result);
                    })
                    .catch(error => {
                        // silently ignore this one for now
                        this.errorSnackbar = true;
                        this.result = null;
                    })
            },
            handleHttpResult(result) {
                let nsfwContentReturned = result.find(item => item.over_18 === true) !== undefined;
                this.result = result;
                if (nsfwContentReturned && !this.getNsfwChoice()) {
                    this.nsfwAlert = true;
                } else {
                    this.showContent();
                }
            }
        }
    }
</script>
