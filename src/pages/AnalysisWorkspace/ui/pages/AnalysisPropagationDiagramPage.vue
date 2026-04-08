<template>
  <MermaidDiagram
    title="Диаграмма распространения от источников"
    subtitle="Mermaid-представление цепочек распространения по текущему фильтру"
    :code="propagationDiagramMermaid"
    @node-dblclick="handleDiagramNodeDblClick"
    @edge-dblclick="handleDiagramEdgeDblClick"
  />
</template>

<script lang="ts" setup>
import MermaidDiagram from "@/components/MermaidDiagram/MermaidDiagram.vue";
import { useAnalysisWorkspace } from "../../model/use-analysis-workspace";
import { useAnalysisDiagramNavigation } from "../../model/use-analysis-diagram-navigation";

const { propagationDiagramMermaid } = useAnalysisWorkspace();
const { handleDiagramEdgeDblClick, handleDiagramNodeDblClick } = useAnalysisDiagramNavigation();
</script>
