<template>
  <mwc-drawer type="modal" ref="elDrawer">
    <div class="d-grid drawer">
      <mwc-textfield
        label="Search" iconTrailing="search"
        :value="q" @input="q = $event.target.value"
        @keydown.enter="doQuery"
      />
      <mwc-list activatable rootTabbable ref="elList">
        <mwc-list-item
          hasMeta
          v-for="el in filelist"
          :key="el.id"
          @request-selected="openFile(el.id)"
        >
          {{ el.title }}
          <mwc-icon class="deleteFile"
            slot="meta" @click="deleteFile(el.id)">delete</mwc-icon>
        </mwc-list-item>
      </mwc-list>
    </div>

    <router-view slot="appContent" />
  </mwc-drawer>
</template>

<script lang="ts" src="./app/index.ts" />

<style scoped>
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

mwc-icon.deleteFile {
  filter: brightness(3);
}

mwc-icon.deleteFile:hover {
  filter: initial;
}
</style>
