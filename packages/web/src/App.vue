<template>
  <md-app>
    <md-app-toolbar>
      <md-button
        class="md-icon-button"
        @click="isDrawer = !isDrawer"
      >
        <md-icon>menu</md-icon>
      </md-button>

      <input :class="'no-formatting title ' + (id ? '' : 'is-new')"
        v-model="title" type="text"
        @keydown.enter="() => { setTitle(); return false }"
        @blur="setTitle"
      />

      <div class="flex-grow-1"></div>

      <md-button class="md-raised button-new"
        @click="newFile"
        :disabled="!id"
      >
        New
      </md-button>

      <md-button class="md-raised button-save"
        @click="saveFile"
        :disabled="!isEdited"
      >
        Save
      </md-button>

      <md-button class="md-raised button-toggle"
        @click="toggle"
      >
        Toggle
      </md-button>
    </md-app-toolbar>

    <md-app-drawer :md-active.sync="isDrawer">
      <md-field>
        <label>Search</label>
        <md-input v-model="q" @keydown.enter="doQuery" />
        <md-icon>search</md-icon>
      </md-field>

      <md-list ref="elList">
        <md-list-item
          v-for="el in filelist"
          :key="el.id"
          @click="loadFile(el.id)"
          :data-selected="el.id === id"
        >
          <span class="md-list-item-text">
            {{ el.title }}
          </span>

          <md-button class="md-icon-button md-list-action"
            @click="deleteFile(el.id)"
          >
            <md-icon>delete</md-icon>
          </md-button>
        </md-list-item>
      </md-list>
    </md-app-drawer>

    <md-app-content>
      <section class="md-layout">
        <article class="md-layout-item editor">
          <textarea ref="editor" />
        </article>
        <article v-show="isViewer" class="md-layout-item viewer" ref="viewer" />
      </section>
    </md-app-content>
  </md-app>
</template>

<script lang="ts" src="./app/index.ts" />

<style lang="scss" scoped>
.md-app-toolbar {
  height: 60px;
  background-color: rgb(255, 238, 83);
}

.md-app-content {
  padding: 0;
  overflow: hidden;

  .md-layout-item {
    height: calc(100vh - 60px);
    box-sizing: border-box;
  }
}

.md-drawer {
  width: 15rem;

  .md-list-item[data-selected] {
    background-color: rgb(185, 228, 255);
  }

  .md-list-item-content {
    text-overflow: ellipsis;
  }
}

.md-field {
  margin: 0;

  label {
    left: 5px;
  }

  .md-icon {
    margin-right: 5px;
  }
}

.viewer {
  padding: 1rem;
  padding-bottom: 100px;
  overflow: scroll;

  ::v-deep img {
    max-width: 100%;
  }
}

.editor {
  overflow-y: scroll;
}

.no-formatting {
  all: unset;
}

.title {
  font-size: 1.1rem;
}

.is-new {
  color: gray;
  font-style: italic;
}

.md-list-action .md-icon:not(:hover) {
  color: rgb(238, 238, 238);
}

.md-button {
  &[class*=" button-"] {
    --md-theme-default-text-primary-on-background: white;
  }

  &.button-new {
    --md-theme-default-background: rgb(255, 105, 19);
  }

  &.button-save {
    --md-theme-default-background: rgb(66, 123, 255);;
  }

  &.button-toggle {
    --md-theme-default-background: rgb(0, 167, 111);
  }
}
</style>
