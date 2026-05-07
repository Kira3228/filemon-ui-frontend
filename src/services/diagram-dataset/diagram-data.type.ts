import { AnalysisDiagramData } from '../../pages/AnalysisWorkspace/model/analysis-report.types';
import { AnalysisFileItem } from '../files/file.types';

export type DiagramDataItem = {
  files: AnalysisFileItem[]
  diagramData: AnalysisDiagramData
}