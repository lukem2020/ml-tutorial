'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { 
  FlaskConical, 
  Target, 
  Dna, 
  Search, 
  RefreshCw, 
  Activity,
  Network,
  TestTube,
  Rocket,
  FileText
} from 'lucide-react'
import styles from './ParentNode.module.css'

const stageIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  'Hypothesis Generation & Disease Understanding': FileText,
  'Target Identification': Target,
  'Target Prioritization & Druggability Assessment': Search,
  'Structure Analysis & Modeling': Dna,
  'Virtual Screening & Hit Identification': Search,
  'Hit-to-Lead Optimization': RefreshCw,
  'ADMET Prediction': Activity,
  'Systems Biology & Pathway Analysis': Network,
  'Experimental Validation': TestTube,
  'Clinical Candidate Selection & Optimization': Rocket,
}

const stageNumberMap: Record<string, number> = {
  'Hypothesis Generation & Disease Understanding': 1,
  'Target Identification': 2,
  'Target Prioritization & Druggability Assessment': 3,
  'Structure Analysis & Modeling': 4,
  'Virtual Screening & Hit Identification': 5,
  'Hit-to-Lead Optimization': 6,
  'ADMET Prediction': 7,
  'Systems Biology & Pathway Analysis': 8,
  'Experimental Validation': 9,
  'Clinical Candidate Selection & Optimization': 10,
}

export function ParentNode({ data, selected }: NodeProps) {
  const Icon = stageIconMap[data.type] || FlaskConical
  const stageNumber = stageNumberMap[data.type] || 0

  return (
    <div className={`${styles.parentNode} ${selected ? styles.selected : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />
      <div className={styles.parentNodeContent}>
        <div className={styles.parentNodeHeader}>
          <div className={styles.stageBadge}>{stageNumber}</div>
          <Icon size={18} />
          <span className={styles.parentNodeTitle}>{data.label || data.type}</span>
        </div>
        {data.description && (
          <div className={styles.parentNodeDescription}>{data.description}</div>
        )}
        {data.childrenCount !== undefined && (
          <div className={styles.childrenInfo}>
            {data.childrenCount} child node{data.childrenCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={styles.handle}
      />
    </div>
  )
}
