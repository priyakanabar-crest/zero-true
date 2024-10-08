<template>
  <cell
    cell-type="text"
    :cell-id="cellData.id"
    :is-dev-mode="$devMode && !isAppRoute && !isMobile"
    :hide-cell="(cellData.hideCell as boolean)"
    :cell-name="(cellData.cellName as string)"
    @save="saveCell"
    @delete="deleteCell"
    @addCell="(e) => createCell(e)"
  >
    <template v-slot:code>
      <tiny-editor
        v-if="$devMode && !isAppRoute && !isMobile"
        v-model="cellData.code"
        :init="init"
        @keyUp="saveCell"
      />
    </template>
    <template v-slot:outcome v-if="($devMode && isAppRoute) || !$devMode">
      <tiny-editor v-model="cellData.code" :init="app_init" :disabled="true" />
    </template>
  </cell>
</template>

<script lang="ts">
import type { PropType } from "vue";
import "tinymce/tinymce";
import "tinymce/models/dom";
import "tinymce/themes/silver";
import "tinymce/icons/default";
import "tinymce/skins/ui/tinymce-5-dark/skin.css";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/plugins/table";
import "tinymce/plugins/image";
import Editor from "@tinymce/tinymce-vue";
import { CodeCell } from "@/types/notebook";
import { useRoute } from "vue-router";
import Cell from "@/components/Cell.vue";

export default {
  components: {
    cell: Cell,
    "tiny-editor": Editor,
  },
  props: {
    cellData: {
      type: Object as PropType<CodeCell>,
      required: true,
    },
  },
  inheritAttrs: false,
  emits: ["saveCell", "deleteCell", "createCell"],
  data() {
    return {
      init: {
        plugins: "autoresize advlist autolink lists link image table",
        toolbar:
          "undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample table | ltr rtl",
        branding: false,
        menubar: false,
        statusbar: false,
        skin: false,
        content_css: false,
        font_formats:
          "Roboto=Roboto, sans-serif;Arial=arial,helvetica,sans-serif;Courier New=courier new,courier,monospace;",
        content_style:
          "body { background-color: #1B2F3C; color: #FFFFFF; font-family: 'Roboto', sans-serif; }",
        autoresize_bottom_margin: 10,
        min_height: 100,
        license_key: "gpl",
      },
      app_init: {
        plugins: "autoresize",
        toolbar: false,
        branding: false,
        menubar: false,
        statusbar: false,
        skin: false,
        content_css: false,
        font_formats:
          "Roboto=Roboto, sans-serif;Arial=arial,helvetica,sans-serif;Courier New=courier new,courier,monospace;",
        content_style:
          "body { background-color: #0E1B23; color: #FFFFFF; font-family: 'Roboto', sans-serif; }",
        min_height: 0,
        autoresize_bottom_margin: 0,
        license_key: "gpl",
      },
      items: [
        { title: "Code" },
        { title: "SQL" },
        { title: "Markdown" },
        { title: "Text" },
      ],
    };
  },
  computed: {
    isAppRoute() {
      const route = useRoute();
      return route.path === "/app";
    },
    isMobile() {
      return this.$vuetify.display.mobile;
    },
  },
  mounted() {},
  methods: {
    saveCell() {
      if (!this.$devMode) return;
      this.$emit("saveCell", this.cellData.id, this.cellData.code, "", "");
    },
    deleteCell() {
      this.$emit("deleteCell", this.cellData.id);
    },
    createCell(cellType: string) {
      this.$emit("createCell", this.cellData.id, cellType);
    },
  },
};
</script>
<style>
.tox .tox-toolbar,
.tox .tox-toolbar__primary,
.tox .tox-toolbar__overflow {
  background-color: #0e1b23 !important;
}
.tox-tinymce {
  border: none !important;
}
</style>
