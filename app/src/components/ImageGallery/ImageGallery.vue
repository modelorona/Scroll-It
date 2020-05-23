<template>
    <v-container fluid>

        <v-row dense :align-content="'center'" :justify="'center'">
            <v-col v-for="post in this.$props.posts" :key="post.src" md="4" lg="4" sm="8" :align-self="'center'">
                <v-card :href="post.src" target="_blank" >
                    <v-img :src="post.src" :alt="'Change this later on'" :key="post.src" ></v-img>
                </v-card>
            </v-col>
        </v-row>

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

        methods: {
            scroll () {
                window.onscroll = () => {
                    let winBottom = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) + window.innerHeight
                        === document.documentElement.offsetHeight;

                    if (winBottom) {
                        this.$emit('update-page');
                    }
                }
            }
        },

        mounted() {
            this.scroll();
        },

        data: () => ({

        }),

    }
</script>

<style scoped>

</style>
