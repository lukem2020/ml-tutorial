'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import styles from './ParentNode.module.css'

const stageEmojiMap: Record<string, string> = {
  'Hypothesis Generation & Disease Understanding': '💡',
  'Target Identification': '🎯',
  'Target Prioritization & Druggability Assessment': '🔍',
  'Structure Analysis & Modeling': '🧬',
  'Virtual Screening & Hit Identification': '🔬',
  'Hit-to-Lead Optimization': '⚗️',
  'ADMET Prediction': '📊',
  'Systems Biology & Pathway Analysis': '🔄',
  'Experimental Validation': '🧪',
  'Clinical Candidate Selection & Optimization': '🚀',
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
  const emoji = stageEmojiMap[data.type] || '⚗️'
  const stageNumber = stageNumberMap[data.type] || 0

  return (
    <div className={`${styles.parentNode} ${selected ? styles.selected : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
        id="target-top"
      />
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
        id="target-left"
      />
      <Handle
        type="target"
        position={Position.Right}
        className={styles.handle}
        id="target-right"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className={styles.handle}
        id="target-bottom"
      />
      <div className={styles.parentNodeContent}>
        <div className={styles.parentNodeHeader}>
          <div className={styles.stageBadge}>{stageNumber}</div>
          <span className={styles.nodeEmoji}>{emoji}</span>
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
        position={Position.Top}
        className={styles.handle}
        id="source-top"
      />
      <Handle
        type="source"
        position={Position.Left}
        className={styles.handle}
        id="source-left"
      />
      <Handle
        type="source"
        position={Position.Right}
        className={styles.handle}
        id="source-right"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
        id="source-bottom"
      />
    </div>
  )
}
