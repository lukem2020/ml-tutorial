'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { FileText, CheckCircle2, Clock, Play } from 'lucide-react'
import styles from './HypothesisNode.module.css'

export function HypothesisNode({ data, selected }: NodeProps) {
  const status = data.status || 'pending' // pending, running, completed
  const hasOutput = data.requiredData && data.requiredData.length > 0

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.onRun) {
      data.onRun(data.id, data.hypothesis || '')
    }
  }

  return (
    <div className={`${styles.hypothesisNode} ${selected ? styles.selected : ''} ${styles[status]}`}>
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
      />
      <div className={styles.nodeContent}>
        <div className={styles.nodeHeader}>
          <FileText size={14} />
          <span className={styles.nodeTitle}>Hypothesis Generation</span>
          <button
            className={styles.runButton}
            onClick={handleRun}
            disabled={status === 'running' || !data.hypothesis}
            title="Run node"
          >
            <Play size={10} />
          </button>
          {status === 'running' && <Clock size={12} className={styles.statusIcon} />}
          {status === 'completed' && <CheckCircle2 size={12} className={styles.statusIcon} />}
        </div>
        
        {data.hypothesis && (
          <div className={styles.hypothesisText}>
            {data.hypothesis.length > 80 
              ? `${data.hypothesis.substring(0, 80)}...` 
              : data.hypothesis}
          </div>
        )}
        
        {hasOutput && (
          <div className={styles.outputBadge}>
            {data.requiredData.length} data requirement{data.requiredData.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
        style={{ visibility: hasOutput ? 'visible' : 'hidden' }}
      />
    </div>
  )
}
