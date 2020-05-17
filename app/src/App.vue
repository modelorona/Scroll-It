<template>
    <v-app>
        <Navbar></Navbar>
        <v-content>
            <Index/>
        </v-content>
    </v-app>
</template>

<script>
    import Index from './components/Index'
    import Navbar from "./components/Navbar/Navbar";

    export default {
        name: 'App',

        components: {
            Navbar,
            Index
        },

        data: () => ({
            //
        })
    }
</script>
