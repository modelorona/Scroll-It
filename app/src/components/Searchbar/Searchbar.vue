<template>
    <v-container>
        <v-form @submit.prevent="">
            <v-row :align-content="'center'" :justify="'center'">
                <v-col cols="8">
                    <v-text-field outlined :label="this.label" filled v-model="text" dense id="search_text_field"
                                  clear-icon="mdi-close-circle" clearable class="ml-1 mr-1"
                                  type="text"  :hint="`${this.label} that you wish to search for.`"
                                  v-on:keyup.enter="searchOnEnter"
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
                            <v-select
                                :items="postTypeOptions"
                                filled v-model="postType"
                                :label="postTypeLabel"
                            ></v-select>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color="primary" text @click="menu = false">Close</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-menu>
                    <v-btn icon large ripple type="submit" :to="`/r/${this.text}?type=${this.postType}`" ref="submit_button">
                        <v-icon>mdi-send</v-icon>
                    </v-btn>
                </v-col>
            </v-row>
        </v-form>
        <v-snackbar
            v-model="autofocus" top
            :color="'info'"
            :multi-line="'multi-line'"
            :timeout="2000"
        >
            Please enter a thread name to search for.
            <v-btn
                dark
                text
                @click="autofocus=false"
            >
                Got it
            </v-btn>
        </v-snackbar>
    </v-container>
</template>

<script>
    export default {
        name: "Searchbar",

        data: () => ({
            postType: 'Hot',
            postTypeOptions: ['Hot', 'New', 'Top'],
            label: 'Enter subreddit name',
            menu: false,
            postTypeLabel: 'Choose post type',
            text: '',
            autofocus: false
        }),

        created() {
            if (this.$route.params.hasOwnProperty('thread')) {
                this.text = this.$route.params.thread;
                if (this.$route.query.hasOwnProperty('type')) {
                    let type = this.$route.query.type;
                    if (this.postTypeOptions.indexOf(type) !== -1) {
                        this.postType = type;
                    }
                }
            }
        },

        watch: {
            $route: function (to, from) {
                if (to.name === 'index') {
                    this.text = '';
                }
            }
        },

        methods: {
            searchOnEnter() {
                // hacky
                if (this.text.length !== 0) {
                    this.$refs.submit_button.$el.click();
                }
            }
        }
    }
</script>

<style scoped>

</style>
