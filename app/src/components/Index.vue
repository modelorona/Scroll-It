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

<!--        insert play button -->

        <v-container fluid>
            <v-row dense :align-content="'center'" :justify="'center'">
                <v-col v-for="post in posts" :key="post.title" md="4" lg="4" sm="8">
                    <v-card @click="enlargePhoto(post)">
                        <v-img :src="post.src" :alt="'Change this later on'"></v-img>
<!--                        <v-card-title v-text="post.title"></v-card-title>-->
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script>
    import snoowrap from 'snoowrap'

    export default {
        name: 'Index',

        data: () => ({
            posts: [
                {title: 'Test title', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg', flex: 6},
                {title: 'Test title2', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg', flex: 6},
                {title: 'Test title3', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg', flex: 6},
                {title: 'Test title4', src: 'https://cdn.vuetifyjs.com/images/cards/house.jpg', flex: 6}
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
            })
        }),

        methods: {
            enlargePhoto(evt) {
                console.log(evt);
            },
            getSubreddit() {
                this.r.getSubreddit(this.text).getNew().then(content => console.log(content))
            },
            clearText() {
                this.text = ''
            }
        }
    }
</script>
