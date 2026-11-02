# Layouts

Layouts are reusable components that wrap around pages. They are used to provide a consistent look and feel across multiple pages.

Layouts are wired up as parent routes in `src/router/index.ts` using Vue Router's [nested routes](https://router.vuejs.org/guide/essentials/nested-routes.html); the layout renders the page through its `<router-view />`.
