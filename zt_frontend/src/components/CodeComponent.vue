<template>
  <cell
    :cell-id="cellData.id"
    cell-type="code"
    :hide-cell="(cellData.hideCell as boolean)"
    :hide-code="(cellData.hideCode as boolean)"
    :expand-code="(cellData.expandCode as boolean)"
    :non-reactive="(cellData.nonReactive as boolean)"
    :cell-name="(cellData.cellName as string)"
    :cell-has-output="hasCellContent"
    :currentlyExecutingCell="currentlyExecutingCell"
    :isCodeRunning="isCodeRunning"
    :is-focused="isFocused"
    :is-dev-mode="$devMode && !isAppRoute && !isMobile"
    @play="runCode(false, '', '')"
    @delete="deleteCell"
    @expandCodeUpdate="(e) => expandCodeUpdate(e)"
    @hideCode="(e) => hideCode(e)"
    @renameCell="(e) => renameCell(e)"
    @updateReactivity="(e) => updateReactivity(e)"
    @addCell="(e) => createCell(e)"
  >
    <template v-slot:header-title>
      <div
        v-if="!$devMode || isAppRoute || isMobile"
        style="display: flex; width: 100%"
      >
        <h4
          v-if="cellData.hideCode"
          class="text-bluegrey-darken-1 text-ellipsis app-static-name"
        >
          {{ cellData.cellName }}
        </h4>
        <v-expansion-panels v-else v-model="expanded">
          <v-expansion-panel v-model="expanded" bg-color="bluegrey-darken-3">
            <v-expansion-panel-title
              class="text-bluegrey-darken-1"
              :id="'codeMirrorAppTitle' + cellData.id"
            >
              <h4 class="text-ellipsis app-static-name">
                {{ cellData.cellName }}
              </h4>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <codemirror
                v-model="cellData.code"
                :style="{ height: '400px' }"
                :autofocus="true"
                :indent-with-tab="true"
                :tab-size="2"
                :viewportMargin="Infinity"
                :extensions="extensions"
                :code="cellData.code"
                :id="'codeMirrorApp' + cellData.id"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </template>
    <template v-slot:code>
      <codemirror
        v-if="$devMode && !isAppRoute && !isMobile"
        v-model="cellData.code"
        :style="{ height: '400px' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :viewportMargin="Infinity"
        :extensions="extensions"
        @ready="handleReady"
        @keyup="saveCell"
        @focus="handleFocus"
        @blur="handleBlur"
        :code="cellData.code"
        :id="'codeMirrorDev' + cellData.id"
      />
    </template>
    <template v-slot:outcome>
      <div :id="'outputContainer_' + cellData.id">
        <layout-component
          v-if="cellData.layout?.rows?.length"
          v-for="(row, rowIndex) in cellData.layout?.rows"
          :key="rowIndex"
          :row-data="row"
          :components="compDict"
          @runCode="runCode"
        />
        <!-- Render unplaced components at the bottom -->
        <div
          v-if="unplacedComponents.length"
          :id="'unplacedComponents' + cellData.id"
        >
          <component-wrapper
            :renderComponents="unplacedComponents"
            :allComponents="compDict"
            @runCode="runCode"
          />
        </div>
        <pre class="code-output" :id="'cellOutput' + cellData.id">{{
          cellData.output
        }}</pre>
      </div>
    </template>
  </cell>
</template>

<script lang="ts">
import type { PropType, ShallowRef } from "vue";
import { shallowRef } from "vue";
import axios from "axios";
import PlotlyPlot from "@/components/PlotlyComponent.vue";
import { Codemirror } from "vue-codemirror";
import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { Prec, EditorState } from "@codemirror/state";
import {
  autocompletion,
  acceptCompletion,
  CompletionResult,
  CompletionContext,
} from "@codemirror/autocomplete";
import {
  VSlider,
  VRating,
  VTextField,
  VFileInput,
  VTextarea,
  VRangeSlider,
  VSelect,
  VCombobox,
  VBtn,
  VImg,
  VAutocomplete,
  VCard,
} from "vuetify/lib/components/index.mjs";
import { VDataTable } from "vuetify/components/VDataTable";
import { CodeCell, Layout, ZTComponent } from "@/types/notebook";
import LayoutComponent from "@/components/LayoutComponent.vue";
import TextComponent from "@/components/TextComponent.vue";
import { globalState } from "@/global_vars";
import { useRoute } from "vue-router";
import Cell from "@/components/Cell.vue";
import { inlineSuggestion } from "codemirror-extension-inline-suggestion";
import ComponentWrapper from "@/components/ComponentWrapper.vue";
import { linter, Diagnostic } from "@codemirror/lint";

export default {
  components: {
    cell: Cell,
    codemirror: Codemirror,
    "v-slider": VSlider,
    "v-rating": VRating,
    "v-text-field": VTextField,
    "v-file-input": VFileInput,
    "v-textarea": VTextarea,
    "v-range-slider": VRangeSlider,
    "v-select": VSelect,
    "v-combobox": VCombobox,
    "v-btn": VBtn,
    "v-img": VImg,
    "v-data-table": VDataTable,
    "v-autocomplete": VAutocomplete,
    "v-card": VCard,
    "v-text": TextComponent,
    "plotly-plot": PlotlyPlot,
    "layout-component": LayoutComponent,
    "component-wrapper": ComponentWrapper,
  },
  props: {
    cellData: {
      type: Object as PropType<CodeCell>,
      required: true,
    },
    completions: {
      type: Object as PropType<any[]>,
      required: true,
    },
    lintResults: {
      type: Array as PropType<any[]>,
      required: true,
    },
    currentlyExecutingCell: {
      type: String,
      default: null,
    },
    isCodeRunning: {
      type: Boolean,
      default: false,
    },
  },
  inheritAttrs: false,
  emits: [
    "componentValueChange",
    "runCode",
    "deleteCell",
    "createCell",
    "saveCell",
    "copilotCompletion",
    "updateTimers",
    "navigateToCell",
  ],
  data() {
    return {
      isFocused: false,
      copilotSuggestion: "",
      copilotAccepted: false,
      expanded: this.cellData.expandCode ? [0] : [],
      items: [
        { title: "Code" },
        { title: "SQL" },
        { title: "Markdown" },
        { title: "Text" },
      ],
      compDict: {} as { [key: string]: ZTComponent },
      runLint: false,
      currentLint: [] as Diagnostic[],
    };
  },

  setup() {
    const view: ShallowRef<EditorView | null> = shallowRef(null);
    const handleReady = (payload: any) => {
      view.value = payload.view;
    };

    return { view, handleReady };
  },

  computed: {
    isAppRoute() {
      const route = useRoute();
      return route.path === "/app";
    },
    isMobile() {
      return this.$vuetify.display.mobile;
    },
    hasCellContent() {
      const hasOutput = Boolean(this.cellData.output?.trim());
      const hasComponents = Boolean(this.cellData.components?.length > 0);
      return hasOutput || hasComponents;
    },
    extensions() {
      const handleCtrlEnter = () => {
        this.runCode(false, "", "");
      };
      const keyMap = keymap.of([
        {
          key: "Ctrl-Enter",
          run: () => {
            if (this.$devMode) {
              handleCtrlEnter();
            }
            return true;
          },
        },
        {
          key: "Tab",
          run: () => {
            if (this.copilotSuggestion) {
              this.copilotAccepted = true;
            }
            return false;
          },
        },
        {
        key: 'ArrowUp',
        run: (view) => {
          if (view.state.selection.main.from === 0) {
            this.$emit('navigateToCell', this.cellData.id, 'up');
            return true;
          }
          return false;
        },
      },
     {
        key: 'ArrowDown',
        run: (view) => {
          if (view.state.selection.main.to === view.state.doc.length) {
            this.$emit('navigateToCell', this.cellData.id, 'down');
            return true;
          }
          return false;
      },
      },
    ]);

      const fetchSuggestion = async (state: any) => {
        if (globalState.copilot_active) {
          if (this.copilotSuggestion) {
            if (this.copilotAccepted) {
              await axios.post(
                import.meta.env.VITE_BACKEND_URL + "copilot/accept_completion",
                {
                  uuid: this.copilotSuggestion,
                }
              );
              this.copilotAccepted = false;
            } else {
              await axios.post(
                import.meta.env.VITE_BACKEND_URL + "copilot/reject_completion",
                {
                  uuid: this.copilotSuggestion,
                }
              );
            }
            this.copilotSuggestion = "";
          }
          const position = state.selection.main.head;
          const line = state.doc.lineAt(position).number;
          const column = position - state.doc.line(line).from;
          const promise = new Promise((resolve, reject) => {
            this.$emit(
              "copilotCompletion",
              this.cellData.id,
              line,
              column,
              (response: any) => {
                resolve(response);
              }
            );
          });
          try {
            const response: any = await promise;
            if (response.status === 200) {
              if (response.data.completions.length > 0) {
                this.copilotSuggestion = response.data.completions[0].uuid;
                return response.data.completions[0].displayText;
              }
            }
          } catch (error) {
            console.log("Error fetching suggestion:", error);
          }
        }
        return "";
      };

      const customCompletionSource = async (context: CompletionContext) => {
        const word = context.matchBefore(/\w*/);
        const from = word ? word.from : context.pos;

        return {
          from: from,
          options: (
            this.completions as unknown as { label: string; type: string }[]
          ).map((c) => ({
            label: c.label,
            type: c.type,
            apply: (
              view: {
                dispatch: (arg0: {
                  changes: { from: any; to: any; insert: any };
                }) => void;
              },
              completion: { label: any },
              from: any,
              to: any
            ) => {
              const insertText = completion.label;
              view.dispatch({
                changes: {
                  from: from,
                  to: to ?? context.pos,
                  insert: insertText,
                },
              });
            },
          })),
        };
      };

      const customLinter = linter(
        (view) => {
          if (!this.isFocused) {
            return [];
          }
          if (!this.runLint) return this.currentLint;
          const diagnostics: Diagnostic[] = [];

          if (Array.isArray(this.lintResults)) {
            this.lintResults.forEach((result: any) => {
              const fromPos =
                view.state.doc.line(result.from.line + 1).from + result.from.ch;
              const toPos =
                view.state.doc.line(result.to.line + 1).from + result.to.ch;

              if (
                fromPos >= 0 &&
                toPos >= fromPos &&
                toPos <= view.state.doc.length
              ) {
                diagnostics.push({
                  from: fromPos,
                  to: toPos,
                  severity: result.severity,
                  message: result.message,
                });
              } else {
                console.warn("Invalid lint result positions:", result);
              }
            });
          } else {
            console.warn("No lint results for cell:", this.cellData.id);
          }
          this.runLint = false;
          this.currentLint = diagnostics;
          return diagnostics;
        },
        {
          needsRefresh: () => this.runLint,
        }
      );

      if (this.$devMode && !this.isAppRoute) {
        return [
          Prec.highest(keyMap),
          python(),
          indentUnit.of("    "),
          oneDark,
          inlineSuggestion({ fetchFn: fetchSuggestion, delay: 400 }),
          autocompletion({ override: [customCompletionSource] }),
          customLinter,
        ];
      }
      return [
        EditorState.readOnly.of(true),
        Prec.highest(keyMap),
        python(),
        oneDark,
      ];
    },

    unplacedComponents() {
      const findPlacedIds = (items: any[]): string[] => {
        let ids: string[] = [];
        for (const item of items) {
          for (const component of item?.components ?? []) {
            if (typeof component === "string") {
              // It's an ID of a regular component
              ids.push(component);
            } else if (component && component.components) {
              // It's a nested row, go deeper
              ids = ids.concat(findPlacedIds([component]));
            }
          }
        }
        return ids;
      };

      const processComponents = (items: any[]): string[] => {
        let ids: string[] = [];
        let timers: ZTComponent[] = [];
        for (const comp of items) {
          this.compDict[comp.id] = comp;
          if (comp.childComponents) {
            ids.push.apply(ids, Object.values(comp.childComponents));
          } else if (comp.component === "v-timer") {
            timers.push(comp);
            ids.push(comp.id);
          }
        }
        this.$emit("updateTimers", this.cellData.id, timers);
        return ids;
      };

      const placedComponentIds = findPlacedIds(
        (this.cellData.layout as Layout)?.rows ?? []
      ).concat(processComponents(this.cellData.components));
      return this.cellData.components.filter(
        (comp) => !placedComponentIds.includes(comp.id)
      );
    },
  },

  mounted() {
    this.$watch(
      () => this.lintResults,
      () => {
        this.runLint = true;
      }
    );
    if (this.cellData.hideCell) {
      this.unplacedComponents;
    }
  },

  methods: {
    runCode(fromComponent: boolean, componentId: string, componentValue: any) {
      if (!this.$devMode && fromComponent) {
        this.$emit(
          "componentValueChange",
          this.cellData.id,
          componentId,
          componentValue,
          this.cellData.nonReactive
        );
      } else {
        this.$emit(
          "runCode",
          this.cellData.id,
          this.cellData.nonReactive,
          componentId
        );
      }
    },
    deleteCell() {
      this.$emit("deleteCell", this.cellData.id);
    },
    createCell(cellType: string) {
      this.$emit("createCell", this.cellData.id, cellType);
    },
    saveCell() {
      if (!this.$devMode || !this.view?.hasFocus) return;
      const position = this.view?.state.selection.main.head;
      const line = this.view?.state.doc.lineAt(position).number;
      const column = position - this.view?.state.doc.line(line).from;
      this.$emit(
        "saveCell",
        this.cellData.id,
        this.cellData.code,
        line,
        column
      );
    },
    expandCodeUpdate(e: Boolean) {
      this.expanded = e ? [0] : [];
    },
    updateReactivity(e: Boolean) {
      this.cellData.nonReactive = e as boolean;
    },
    hideCode(e: Boolean) {
      this.cellData.hideCode = e as boolean;
    },
    renameCell(e: String) {
      this.cellData.cellName = e as string;
    },
    handleFocus() {
      this.isFocused = true;
      this.runLint = true;
      if (this.getEditorView()) {
        if (this.view) {
          this.view.dispatch({});
        }
      }
    },
    handleBlur() {
      this.isFocused = false;
      this.runLint = true;
      if (this.view) {
        this.view.dispatch({});
      }
    },
    getEditorView() {
      return this.view || null;
    },
  },
};
</script>

<style lang="scss" scoped>
.app-static-name {
  cursor: text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.plot-container) {
  overflow: auto;
}
</style>
