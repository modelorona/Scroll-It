# GEMINI.md

## Project Overview

This project, "Scroll-It," is a web application that provides an auto-scrolling slideshow for Reddit image threads. It is built with Vue.js 3, using Vite for the build tool and Vuetify for the UI framework. The application allows users to enter a subreddit and view a slideshow of the images from that subreddit. It also includes features for handling NSFW content and infinite scrolling.

The main technologies used in this project are:

*   **Vue.js 3:** A progressive JavaScript framework for building user interfaces.
*   **Vite:** A fast build tool for modern web projects.
*   **Vuetify:** A Material Design component framework for Vue.js.
*   **Pinia:** A state management library for Vue.js.
*   **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
*   **ESLint:** A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.

The project is structured as a single-page application (SPA) with a component-based architecture. The main components are:

*   **`App.vue`:** The main application component that sets up the layout and router view.
*   **`Main.vue`:** The main component that contains the app bar and the `ScrollContent` component.
*   **`ScrollContent.vue`:** The core component that handles the logic for fetching images from Reddit, managing the slideshow, and handling user interactions.
*   **`SearchBar.vue`:** A component that allows users to search for a subreddit.
*   **`ImageGrid.vue`:** A component that displays the images in a grid layout.
*   **`ImageOverlay.vue`:** A component that displays the images in a full-screen overlay with slideshow controls.
*   **`NSFWAlert.vue`:** A component that warns users about NSFW content and asks for their consent.

## Building and Running

To build and run this project, you will need to have Node.js and pnpm installed on your machine.

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    This will start a development server on `http://localhost:5173`.

3.  **Build for production:**

    ```bash
    pnpm build
    ```

    This will create a `dist` directory with the production-ready files.

4.  **Lint the code:**

    ```bash
    pnpm lint
    ```

    This will run ESLint to check for any linting errors.

## Development Conventions

The project follows the standard Vue.js conventions and uses ESLint to enforce a consistent coding style. The code is written in TypeScript and uses the Composition API with `<script setup>`.

The project also uses the following tools and libraries to improve the development experience:

*   **`unplugin-auto-import`:** Automatically imports components and APIs.
*   **`unplugin-vue-components`:** Automatically imports Vue components.
*   **`unplugin-vue-router`:** Automatically generates routes from the files in the `src/pages` directory.
*   **`vite-plugin-vue-layouts`:** A plugin for creating layouts in Vue applications.

When contributing to this project, please follow the existing coding style and conventions.
