<template>
  <mwc-drawer type="modal">
    <div class="d-grid drawer">
      <mwc-textfield
        label="Search" iconTrailing="search"
      />
      <mwc-list activatable rootTabbable ref="list">
        <mwc-list-item
          v-for="(name, i) in filelist"
          :key="i"
          @request-selected="filename = name"
        > {{ name }} </mwc-list-item>
      </mwc-list>
    </div>

    <section slot="appContent" class="app d-grid">
      <mwc-top-app-bar>
        <mwc-icon-button slot="navigationIcon"
          icon="menu"
          @click="$el.open = !$el.open"
        />
        <div slot="title">
          <input class="no-formatting"
            v-model="filename" type="text"
            @keydown="validateFilename"
          />
        </div>
        <mwc-button slot="actionItems" raised
          label="Save"
        />
        <mwc-button slot="actionItems" raised
          label="Toggle"
          @click="toggle"
        />
      </mwc-top-app-bar>
      <section class="d-grid" :class="(isViewer && isEditor) ? 'is-split-2' : 'is-split-1'">
        <article v-show="isEditor" class="editor">
          <codemirror ref="cm" />
        </article>
        <article v-show="isViewer" class="viewer content" ref="viewer" />
      </section>
    </section>
  </mwc-drawer>
</template>

<script lang="ts" src="./app/index.ts" />

<style scoped>
.app {
  height: 100%;
  grid-template-rows: auto 1fr;
  overflow: hidden;
}

.drawer {
  grid-template-rows: auto 1fr;
  height: 100vh;
}

mwc-drawer {
  height: 100vh;
  width: 100vw;
}

mwc-list {
  overflow: scroll;
}

mwc-button {
  --mdc-theme-on-primary: initial;
}

mwc-button + mwc-button {
  margin-left: 1rem;
}

mwc-button[label="Save"] {
  --mdc-theme-primary: rgb(66, 123, 255);
}

mwc-button[label="Toggle"] {
  --mdc-theme-primary: rgb(0, 167, 111);
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

.editor {
  overflow-y: scroll;
}

input.no-formatting {
  all: unset;
}
</style>
