<template>
  <mwc-drawer type="modal">
    <div class="d-grid drawer">
      <mwc-textfield
        label="Search" iconTrailing="search"
        :value="q" @input="q = $event.target.value"
        @keydown.enter="doQuery"
      />
      <mwc-list activatable rootTabbable ref="list">
        <mwc-list-item
          hasMeta
          v-for="el in filelist"
          :key="el.id"
          @request-selected="loadFile(el.id)"
        >
          {{ el.title }}
          <mwc-icon class="deleteFile"
            slot="meta" @click="deleteFile(el.id)">delete</mwc-icon>
        </mwc-list-item>
      </mwc-list>
    </div>

    <section slot="appContent" class="app d-grid">
      <mwc-top-app-bar>
        <mwc-icon-button slot="navigationIcon"
          icon="menu"
          @click="$el.open = !$el.open"
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

.viewer >>> img {
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

mwc-icon.deleteFile {
  filter: brightness(3);
}

mwc-icon.deleteFile:hover {
  filter: initial;
}

.is-new {
  filter: brightness(3);
  font-style: italic;
}
</style>
