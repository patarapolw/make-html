<template>
  <section class="app d-grid">
    <nav class="navbar is-success" role="navigation" aria-label="main navigation">
      <a role="button" class="navbar-burger burger">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
      <div class="flex-grow-1"></div>
      <b-button class="is-primary" @click="toggle">Toggle</b-button>
    </nav>
    <section class="d-grid" :class="(isViewer && isEditor) ? 'is-split-2' : 'is-split-1'">
      <article v-show="isEditor" class="editor">
        <codemirror ref="cm" />
      </article>
      <article v-show="isViewer" class="viewer content">
        {{ markdown }}
      </article>
    </section>
  </section>
</template>

<script lang="ts" src="./app/index.ts" />

<style scoped>
.app {
  height: 100vh;
  width: 100vw;
  grid-template-rows: 60px minmax(300px, auto);
  overflow: hidden;
}

.nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 1rem;
  margin-right: 1rem;
}

.viewer {
  padding: 1rem;
}

.is-split-2 {
  grid-template-columns: repeat(2, 1fr);
}

.is-split-1 {
  grid-template-columns: 1fr;
}
</style>
