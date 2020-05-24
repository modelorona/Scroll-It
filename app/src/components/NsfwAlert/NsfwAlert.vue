<template>
    <v-alert v-model="this.$props.alert"
             icon="mdi-alert-octagon"
             prominent border="left"
             text dense
             type="info"
    >
        <v-row align="center">
            <v-col class="grow"> Your search returned some NSFW (Not Safe For Work) content. Would you like to see this content?</v-col>
            <v-col class="shrink">
                <v-btn icon small ripple type="button" color="black" @click="setNsfwChoice(false)">
                    <v-icon>mdi-cancel</v-icon>
                </v-btn>
            </v-col>
            <v-col class="shrink">
                <v-btn icon small ripple type="button" color="black" @click="setNsfwChoice(true)">
                    <v-icon>mdi-check</v-icon>
                </v-btn>
            </v-col>
        </v-row>
    </v-alert>
</template>

<script>
    export default {
        name: "NsfwAlert",
        props: {
            alert: {
                required: true,
                type: Boolean
            }
        },
        methods: {
            setNsfwChoice(val) {
                this.$emit('set-nsfw-choice', val);
            }
        }
    }
</script>

<style scoped>

</style>
