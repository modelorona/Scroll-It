'use strict';
import snoowrap from "snoowrap";

const r = new snoowrap({
    userAgent: process.env.VUE_APP_USER_AGENT,
    clientId: process.env.VUE_APP_CLIENT_ID,
    clientSecret: process.env.VUE_APP_CLIENT_SECRET,
    refreshToken: process.env.VUE_APP_REFRESH_TOKEN
})


function getSubredditWithParams(text, postType, nsfw) {
    r.getSubreddit(text).getNew().then(content => console.log(content));
}


export {
    getSubredditWithParams
}
