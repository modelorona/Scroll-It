<template>
    <v-app>
        <Navbar></Navbar>
        <v-main>
            <keep-alive>
                <router-view></router-view>
            </keep-alive>
        </v-main>
    </v-app>
</template>

<script>
    // import Index from './components/Index'
    import Navbar from "./components/Navbar/Navbar";

    export default {
        name: 'App',

        components: {
            Navbar,
            // Index
        },

        data: () => ({
            //
        })
    }
</script>
