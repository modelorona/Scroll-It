<template>
  <v-footer app height="40">
    <a
      v-for="item in items"
      :key="item.title"
      class="d-inline-block mx-2 social-link"
      :href="item.href"
      rel="noopener noreferrer"
      target="_blank"
      :title="item.title"
    >
      <v-icon
        :icon="item.icon"
        :size="item.icon === '$vuetify' ? 24 : 16"
      />
    </a>

    <div
      class="text-caption text-disabled"
      style="position: absolute; right: 16px;"
    >
      &copy; 2020-{{ (new Date()).getFullYear() }} <span class="d-none d-sm-inline-block">modelorona</span>
      —
      <a
        class="text-decoration-none on-surface"
        href="https://github.com/modelorona/Scroll-It/blob/master/LICENSE"
        rel="noopener noreferrer"
        target="_blank"
      >
        MIT License
      </a>
    </div>
  </v-footer>
</template>

<script setup lang="ts">
  const items = [
    {
      title: 'Scroll-It GitHub',
      icon: `mdi-github`,
      href: 'https://github.com/modelorona/Scroll-It',
    },
    {
      title: 'LinkedIn',
      icon: `mdi-linkedin`,
      href: 'https://www.linkedin.com/in/ahristozov/',
    },
  ]
</script>

<style scoped lang="sass">
  .social-link :deep(.v-icon)
    color: rgba(var(--v-theme-on-background), var(--v-disabled-opacity))
    text-decoration: none
    transition: .2s ease-in-out

    &:hover
      color: rgba(25, 118, 210, 1)
</style>
