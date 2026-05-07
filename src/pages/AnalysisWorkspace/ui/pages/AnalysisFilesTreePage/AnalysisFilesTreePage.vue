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
import { useAnalysisDiagramNavigation } from "../../../model/use-analysis-diagram-navigation";
import { useGetFileTreeDiagram } from "../../../model/queries/useGetFileTreeDiagram";

const { data: fileTreeDiagramMermaid } = useGetFileTreeDiagram();

const { handleDiagramEdgeDblClick, handleDiagramNodeDblClick } = useAnalysisDiagramNavigation();
</script>
