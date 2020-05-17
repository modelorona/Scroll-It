'use strict';
import snoowrap from "snoowrap";

const r = new snoowrap({
    userAgent: process.env.VUE_APP_USER_AGENT,
    clientId: process.env.VUE_APP_CLIENT_ID,
    clientSecret: process.env.VUE_APP_CLIENT_SECRET,
    refreshToken: process.env.VUE_APP_REFRESH_TOKEN
})


function getSubredditWithParams(text, postType, limit, after) {
    const options = {
        limit: limit,
        after: after,
        count: limit
    }
    // null means the subreddit most likely does not exist, or may be down
    return new Promise((resolve, reject) => {
        if (postType.toLowerCase() === 'hot')
            r.getSubreddit(text).getHot(options).then(content => resolve(content)).catch(() => reject(null));
        else if (postType.toLowerCase() === 'new')
            r.getSubreddit(text).getNew(options).then(content => resolve(content)).catch(() => reject(null));
        else
            r.getSubreddit(text).getTop(options).then(content => resolve(content)).catch(() => reject(null));
    });

}


export {
    getSubredditWithParams
}
