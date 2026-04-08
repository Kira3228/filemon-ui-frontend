<template>
  <MermaidDiagram
    title="Дерево файлов"
    subtitle="Mermaid-дерево по текущему набору файлов и активным фильтрам"
    :code="fileTreeDiagramMermaid"
    @node-dblclick="handleDiagramNodeDblClick"
    @edge-dblclick="handleDiagramEdgeDblClick"
  />
</template>

<script lang="ts" setup>
import MermaidDiagram from "@/components/MermaidDiagram/MermaidDiagram.vue";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";
import { useAnalysisDiagramNavigation } from "../../model/use-analysis-diagram-navigation";

const { fileTreeDiagramMermaid } = useAnalysisWorkspace();
const { handleDiagramEdgeDblClick, handleDiagramNodeDblClick } = useAnalysisDiagramNavigation();
</script>
