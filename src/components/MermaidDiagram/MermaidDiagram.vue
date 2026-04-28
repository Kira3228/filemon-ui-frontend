<template>
  <section class="app-surface mermaid-card">
    <header class="mermaid-card__header">
      <div class="mermaid-card__heading">
        <div class="mermaid-card__title">{{ title }}</div>
        <div v-if="subtitle" class="mermaid-card__subtitle">{{ subtitle }}</div>
      </div>
      <div class="mermaid-card__actions">
        <div class="mermaid-card__zoom-controls">
          <UiButton
            variant="secondary"
            title="Уменьшить масштаб"
            @click="zoomOut"
          >
            -
          </UiButton>
          <label class="mermaid-card__zoom-input-shell">
            <input
              v-model="zoomInput"
              type="number"
              inputmode="decimal"
              step="1"
              min="1"
              class="mermaid-card__zoom-input"
              aria-label="Масштаб диаграммы в процентах"
              @change="applyZoomInput"
              @keydown.enter.prevent="applyZoomInput"
              @blur="applyZoomInput"
            />
            <span class="mermaid-card__zoom-suffix">%</span>
          </label>
          <UiButton
            variant="secondary"
            title="Увеличить масштаб"
            @click="zoomIn"
          >
            +
          </UiButton>
          <UiButton
            variant="secondary"
            class="mermaid-card__action mermaid-card__action--icon"
            title="Сбросить масштаб до 100%"
            aria-label="Сбросить масштаб до 100%"
            @click="resetZoom"
          >
            <span class="pi pi-refresh" />
          </UiButton>
        </div>
        <UiButton variant="secondary" @click="copyCode">
          Скопировать Mermaid
        </UiButton>
      </div>
    </header>

    <div
      ref="canvasRef"
      class="mermaid-card__canvas"
      :class="{ 'mermaid-card__canvas--dragging': isDraggingDiagram }"
      @pointerdown="startDiagramDrag"
      @pointermove="dragDiagram"
      @pointerup="stopDiagramDrag"
      @pointercancel="stopDiagramDrag"
      @pointerleave="stopDiagramDrag"
    >
      <div
        ref="diagramRef"
        class="mermaid-card__diagram"
        :class="{
          'mermaid-card__diagram--hidden': isRendering || !!renderError,
        }"
      />
      <div v-if="renderError" class="mermaid-card__state mermaid-card__error">
        {{ renderError }}
      </div>
      <div
        v-else-if="isRendering"
        class="mermaid-card__state mermaid-card__loading"
      >
        Рендерим диаграмму...
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { loadMermaid } from "@/shared/utils/mermaid";
import { UiButton } from "@/components/UiButton";
interface IProps {
  code: string;
  title: string;
  subtitle?: string;
}

const props = defineProps<IProps>();
const emit = defineEmits<{
  (e: "node-dblclick", nodeId: string): void;
  (e: "edge-dblclick", edgeKey: string): void;
}>();

const DIAGRAM_ZOOM_STEP = 0.1;

const canvasRef = ref<HTMLElement | null>(null);
const diagramRef = ref<HTMLElement | null>(null);
const isRendering = ref(false);
const renderError = ref("");
const diagramZoom = ref(1);
const zoomInput = ref("100");
const baseDiagramSize = ref<{ width: number; height: number } | null>(null);
const isDraggingDiagram = ref(false);
let detachInteractions: (() => void) | null = null;
let themeObserver: MutationObserver | null = null;
let dragStart = {
  pointerId: 0,
  clientX: 0,
  clientY: 0,
  scrollLeft: 0,
  scrollTop: 0,
};

const isDarkTheme = () => {
  if (typeof document === "undefined") {
    return false;
  }
  return document.documentElement.classList.contains("dark");
};

const getMermaidThemeConfig = () => {
  if (isDarkTheme()) {
    return {
      theme: "base",
      themeVariables: {
        background: "#1d2b40",
        mainBkg: "#2a3d59",
        secondBkg: "#314663",
        tertiaryColor: "#314663",
        primaryColor: "#2563eb",
        primaryTextColor: "#162033",
        primaryBorderColor: "#60a5fa",
        secondaryColor: "#0f8a7b",
        secondaryTextColor: "#162033",
        secondaryBorderColor: "#2dd4bf",
        tertiaryTextColor: "#162033",
        lineColor: "#7b96bc",
        textColor: "#dfe8f6",
        nodeTextColor: "#162033",
        clusterBkg: "#22324a",
        clusterBorder: "#46617f",
        edgeLabelBackground: "#22324a",
        defaultLinkColor: "#93c5fd",
      },
    };
  }

  return {
    theme: "default",
  };
};

const normalizeMermaidId = (value?: string | null) => {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }
  const primary = text.match(/^(?:flowchart|graphDiv)-(.+)$/)?.[1] || text;
  const normalized = primary.match(/^(.+)-\d+$/)?.[1] || primary;
  return normalized || null;
};

const extractNodeId = (eventTarget: EventTarget | null) => {
  const element = eventTarget instanceof Element ? eventTarget : null;
  const node = element?.closest(".node, .cluster");
  if (!node) {
    return null;
  }
  return normalizeMermaidId(node.getAttribute("id"));
};

const extractEdgeKey = (eventTarget: EventTarget | null) => {
  const element = eventTarget instanceof Element ? eventTarget : null;
  const edge = element?.closest(".edgePath");
  const className = edge?.getAttribute("class") || "";
  const fromId = className.match(/\bLS-([A-Za-z0-9_]+)\b/)?.[1];
  const toId = className.match(/\bLE-([A-Za-z0-9_]+)\b/)?.[1];
  if (!fromId || !toId) {
    return null;
  }
  return `${fromId}->${toId}`;
};

const bindInteractions = (target: HTMLElement) => {
  if (detachInteractions) {
    detachInteractions();
    detachInteractions = null;
  }

  const handleDoubleClick = (event: MouseEvent) => {
    const nodeId = extractNodeId(event.target);
    if (nodeId) {
      emit("node-dblclick", nodeId);
      return;
    }

    const edgeKey = extractEdgeKey(event.target);
    if (edgeKey) {
      emit("edge-dblclick", edgeKey);
    }
  };

  target.addEventListener("dblclick", handleDoubleClick);
  detachInteractions = () => {
    target.removeEventListener("dblclick", handleDoubleClick);
  };
};

const normalizeZoom = (value: number) => Number(value.toFixed(4));

const getSvgBaseSize = (svg: SVGSVGElement) => {
  const viewBox = svg.viewBox?.baseVal;
  const attrWidth = Number.parseFloat(svg.getAttribute("width") || "");
  const attrHeight = Number.parseFloat(svg.getAttribute("height") || "");
  const width =
    viewBox?.width || attrWidth || svg.getBoundingClientRect().width || 0;
  const height =
    viewBox?.height || attrHeight || svg.getBoundingClientRect().height || 0;

  return width > 0 && height > 0 ? { width, height } : null;
};

const applyDiagramZoom = () => {
  const svg = diagramRef.value?.querySelector("svg") as SVGSVGElement | null;
  if (!svg) {
    return;
  }

  if (!baseDiagramSize.value) {
    baseDiagramSize.value = getSvgBaseSize(svg);
  }

  const baseSize = baseDiagramSize.value;
  svg.style.display = "block";
  svg.style.maxWidth = "none";

  if (!baseSize) {
    svg.style.width = "auto";
    svg.style.height = "auto";
    zoomInput.value = String(Number((diagramZoom.value * 100).toFixed(2)));
    return;
  }

  svg.style.width = `${baseSize.width * diagramZoom.value}px`;
  svg.style.height = `${baseSize.height * diagramZoom.value}px`;
  zoomInput.value = String(Number((diagramZoom.value * 100).toFixed(2)));
};

const setDiagramZoom = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    zoomInput.value = String(Number((diagramZoom.value * 100).toFixed(2)));
    return;
  }

  diagramZoom.value = normalizeZoom(value);
  applyDiagramZoom();
};

const zoomIn = () => {
  setDiagramZoom(diagramZoom.value + DIAGRAM_ZOOM_STEP);
};

const zoomOut = () => {
  setDiagramZoom(diagramZoom.value - DIAGRAM_ZOOM_STEP);
};

const resetZoom = () => {
  setDiagramZoom(1);
};

const applyZoomInput = () => {
  const normalizedText = String(zoomInput.value || "")
    .replace(",", ".")
    .trim();
  const nextPercent = Number.parseFloat(normalizedText);

  if (!Number.isFinite(nextPercent) || nextPercent <= 0) {
    zoomInput.value = String(Number((diagramZoom.value * 100).toFixed(2)));
    return;
  }

  setDiagramZoom(nextPercent / 100);
};

const startDiagramDrag = (event: PointerEvent) => {
  const canvas = canvasRef.value;
  if (!canvas || event.button !== 0 || renderError.value || isRendering.value) {
    return;
  }

  const element = event.target instanceof Element ? event.target : null;
  if (element?.closest("button, input, textarea, select, a")) {
    return;
  }

  isDraggingDiagram.value = true;
  dragStart = {
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY,
    scrollLeft: canvas.scrollLeft,
    scrollTop: canvas.scrollTop,
  };
  canvas.setPointerCapture(event.pointerId);
};

const dragDiagram = (event: PointerEvent) => {
  const canvas = canvasRef.value;
  if (!canvas || !isDraggingDiagram.value || event.pointerId !== dragStart.pointerId) {
    return;
  }

  event.preventDefault();
  canvas.scrollLeft = dragStart.scrollLeft - (event.clientX - dragStart.clientX);
  canvas.scrollTop = dragStart.scrollTop - (event.clientY - dragStart.clientY);
};

const stopDiagramDrag = (event: PointerEvent) => {
  const canvas = canvasRef.value;
  if (!canvas || !isDraggingDiagram.value || event.pointerId !== dragStart.pointerId) {
    return;
  }

  isDraggingDiagram.value = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
};

const renderDiagram = async () => {
  const target = diagramRef.value;
  if (!target) {
    return;
  }

  isRendering.value = true;
  renderError.value = "";

  try {
    const mermaid = await loadMermaid();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      ...getMermaidThemeConfig(),
    });

    const renderId = `mermaid-${Math.random().toString(36).slice(2)}`;
    const renderResult = await mermaid.render(renderId, props.code);
    target.innerHTML = renderResult.svg;
    baseDiagramSize.value = null;
    applyDiagramZoom();
    bindInteractions(target);
  } catch (error) {
    console.error(error);
    renderError.value = "Не удалось отрисовать Mermaid-диаграмму";
    if (target) {
      target.innerHTML = "";
    }
  } finally {
    isRendering.value = false;
  }
};

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code);
  } catch (error) {
    console.error(error);
  }
};

watch(
  () => props.code,
  async () => {
    await nextTick();
    await renderDiagram();
  },
);

onMounted(async () => {
  if (typeof document !== "undefined") {
    themeObserver = new MutationObserver(() => {
      renderDiagram().catch((error) => {
        console.error(error);
      });
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  await renderDiagram();
});

onBeforeUnmount(() => {
  if (detachInteractions) {
    detachInteractions();
    detachInteractions = null;
  }

  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
});
</script>

<style scoped>
@import "../../pages/AnalysisWorkspace/ui/styles/analysis-card-surface.css";

.mermaid-card__header {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--analysis-header-gap);
  margin-bottom: var(--analysis-header-margin);
  min-width: 0;
}

.mermaid-card {
  --mermaid-canvas-bg: var(--app-surface);
  --mermaid-label-color: var(--app-text);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.mermaid-card__heading {
  flex: 1 1 auto;
  min-width: 0;
}

.mermaid-card__title {
  font-size: var(--analysis-heading-size);
  font-weight: var(--analysis-heading-weight);
  line-height: 1.3;
}

.mermaid-card__actions,
.mermaid-card__zoom-controls {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.mermaid-card__actions {
  flex: 0 0 auto;
}

.mermaid-card__subtitle {
  margin-top: 0.3rem;
  color: var(--app-text-muted);
  font-size: var(--analysis-meta-size);
  line-height: var(--analysis-meta-line-height);
}

.mermaid-card__action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  border-radius: 999px;
  padding: 0.42rem 0.92rem;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  transition: background-color 0.18s ease, border-color 0.18s ease,
    color 0.18s ease;
}

.mermaid-card__action:hover {
  border-color: #2563eb;
  background: var(--app-surface-muted);
}

.mermaid-card__action--icon {
  justify-content: center;
  min-width: 2.4rem;
  padding-left: 0.7rem;
  padding-right: 0.7rem;
}

.mermaid-card__zoom-input-shell {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  padding: 0.15rem 0.35rem 0.15rem 0.55rem;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-muted);
}

.mermaid-card__zoom-input {
  width: 4.5rem;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--app-text);
  font-size: var(--analysis-control-font-size);
}

.mermaid-card__zoom-input::-webkit-outer-spin-button,
.mermaid-card__zoom-input::-webkit-inner-spin-button {
  margin: 0;
}

.mermaid-card__zoom-suffix {
  color: var(--app-text-muted);
  font-size: var(--analysis-control-font-size);
}

.mermaid-card__action .pi {
  font-size: 12px;
}

.mermaid-card__canvas {
  position: relative;
  flex: 1 1 auto;
  min-height: 240px;
  min-width: 0;
  max-height: calc(100vh - 240px);
  overflow: auto;
  border: 1px solid var(--app-border);
  border-radius: var(--analysis-surface-radius);
  background: var(--mermaid-canvas-bg);
  padding: var(--analysis-surface-padding);
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.mermaid-card__canvas--dragging {
  cursor: grabbing;
}

.mermaid-card__diagram {
  display: inline-block;
  min-width: max-content;
}

.mermaid-card__diagram--hidden {
  visibility: hidden;
}

:deep(.mermaid-card__diagram svg) {
  display: block;
  width: auto;
  max-width: none;
  height: auto;
  background: transparent;
  color: var(--app-text);
}

:deep(.mermaid-card__diagram svg .edgeLabel),
:deep(.mermaid-card__diagram svg .edgeLabel tspan),
:deep(.mermaid-card__diagram svg .labelBkg + g text),
:deep(.mermaid-card__diagram svg .pathLabel),
:deep(.mermaid-card__diagram svg .pathLabel tspan) {
  fill: var(--mermaid-label-color) !important;
  color: var(--mermaid-label-color) !important;
}

.mermaid-card__state {
  position: absolute;
  inset: var(--analysis-surface-padding);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
}

.mermaid-card__loading,
.mermaid-card__error {
  color: var(--app-text-muted);
  font-size: var(--analysis-meta-size);
  line-height: var(--analysis-meta-line-height);
}

@media (max-width: 960px) {
  .mermaid-card__header {
    flex-direction: column;
  }

  .mermaid-card__actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
