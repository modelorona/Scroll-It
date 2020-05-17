import {getSubredditWithParams} from "../../api/reddit";

const state = () => ({
    text: '',
    after: ''
});


const getters = {
    text: (state) => {
        return state.text;
    },
    after: (state) => {
        return state.text;
    }
}

const actions = {
    getContent({commit, state}, text, postType, limit) {
        getSubredditWithParams(text, postType, limit, state.after)
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
    }
}

const mutations = {
    setText (state, newText) {
        state.text = newText;
    },
    setAfter (state, newAfter) {
        state.after = newAfter;
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}



