<template>
  <section class="app d-grid">
      <mwc-top-app-bar>
        <mwc-icon-button slot="navigationIcon"
          icon="menu"
          @click="toggleDrawer"
        />
        <div slot="title" :class="id ? '' : 'is-new'">
          <input class="no-formatting"
            v-model="title" type="text"
            @keydown.enter="() => false"
            @blur="setTitle"
          />
        </div>
        <mwc-button slot="actionItems" raised
          label="New"
          @click="newFile"
          :disabled="!id"
        />
        <mwc-button slot="actionItems" raised
          label="Save"
          @click="saveFile"
          :disabled="!isEdited"
        />
        <mwc-button slot="actionItems" raised
          label="Toggle"
          @click="isViewer = !isViewer"
        />
      </mwc-top-app-bar>
      <section class="d-grid" :class="isViewer ? 'is-split-2' : 'is-split-1'">
        <article class="editor">
          <textarea ref="elCm" />
        </article>
        <article v-show="isViewer" class="viewer content" ref="elViewer" />
      </section>
    </section>
</template>

<script lang="ts" src="./index.ts"></script>

<style scoped>
.app {
  height: 100%;
  grid-template-rows: auto 1fr;
  overflow: hidden;
}

mwc-button {
  --mdc-theme-on-primary: initial;
}

mwc-button + mwc-button {
  margin-left: 1rem;
}

mwc-button[label="New"] {
  --mdc-theme-primary: rgb(255, 105, 19);
}

mwc-button[label="Save"] {
  --mdc-theme-primary: rgb(66, 123, 255);
}

mwc-button[label="Toggle"] {
  --mdc-theme-primary: rgb(0, 167, 111);
}

.viewer {
  padding: 1rem;
  padding-bottom: 100px;
  overflow: scroll;
}

.viewer ::v-deep(img) {
  max-width: 100%;
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

.editor, .viewer {
  height: calc(100vh - 60px);
  box-sizing: border-box;
}

input.no-formatting {
  all: unset;
}

.is-new {
  filter: brightness(3);
  font-style: italic;
}
</style>
