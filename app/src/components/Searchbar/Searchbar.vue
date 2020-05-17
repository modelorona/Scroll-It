<template>
    <v-container>
        <v-row :align-content="'center'" :justify="'center'">
            <v-col cols="8">
                <v-text-field outlined :label="this.label" filled v-model="text" dense
                              clear-icon="mdi-close-circle" clearable class="ml-1 mr-1"
                              type="text" @click:clear="clearText" :hint="`${this.label} that you wish to search for.`"
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
                <v-btn icon large ripple type="submit" @click="getSubreddit">
                    <v-icon>mdi-send</v-icon>
                </v-btn>
            </v-col>
        </v-row>
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
            text: ''
        }),

        methods: {
            clearText() {
                this.$emit('cleartext');
            },
            getSubreddit(){
                this.$emit('getSubreddit', this.text, this.postType, false);
            },
        }
    }
</script>

<style scoped>

</style>
