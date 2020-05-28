<template>
    <div>
        <v-app-bar
            app
            type="primary"
            dark dense
        >
            <div class="d-flex align-center">
                <router-link to="/">
                    <v-img
                        alt="Scroll-It"
                        class="shrink mr-2"
                        contain
                        src="../../assets/logo-white.png"
                        transition="scale-transition"
                        width="40"
                    />
                </router-link>
                <router-link to="/">
                    <v-img
                        alt="Scroll-It"
                        class="shrink mt-1"
                        contain
                        min-width="100"
                        src="../../assets/navbar.png"
                        width="100"
                    />
                </router-link>
            </div>

            <v-spacer></v-spacer>

            <div class="text-center">
                <v-dialog
                    v-model="dialog"
                    width="500"
                >
                    <template v-slot:activator="{ on }">
                        <v-btn v-on="on" icon>
                            <v-icon large>mdi-information</v-icon>
                        </v-btn>
                    </template>

                    <v-card>
                        <v-card-title
                            class="headline grey lighten-2"
                            primary-title
                        >
                            What is this?
                        </v-card-title>

                        <v-card-text>
                            This is a small side project during the Lockdown of 2020. I wanted to take the time to learn more about Vue.js and Vuetify. I was inspired by <a href="http://www.imagoid.com/" target="_blank">Imagoid</a>
                            and so created a very simple auto scroller for Reddit image posts. I hope you enjoy, and if you find any issues you can leave an issue in the source code repository!
                            <v-icon>mdi-emoticon-happy</v-icon>

                            <br/><br/>
                            You can find me on <a href="https://www.linkedin.com/in/ahristozov/" target="_blank">LinkedIn</a> for any further questions or inquiries. Stay safe!
                        </v-card-text>

                        <v-divider></v-divider>

                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn
                                color="primary" link
                                text target="_blank" href="https://github.com/modelorona/Scroll-It"
                            >
                                See source code
                            </v-btn>
                            <v-btn
                                color="primary"
                                text
                                @click="dialog=false"
                            >
                                Close
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </div>

        </v-app-bar>
    </div>
</template>

<script>
    export default {
        name: "Navbar",
        data: () => ({
            dialog: false
        }),
    }
</script>

<style scoped>
    .nav-bar-image {
        cursor: pointer;
    }
</style>
