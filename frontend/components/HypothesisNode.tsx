'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { CheckCircle2, Clock, Play } from 'lucide-react'
import styles from './HypothesisNode.module.css'

export function HypothesisNode({ id, data, selected }: NodeProps) {
  const status = data.status || 'pending' // pending, running, completed
  const hasOutput = data.requiredData && data.requiredData.length > 0

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (data.onRun && id) {
      // Pass: nodeId, hypothesis
      data.onRun(id, data.hypothesis || '')
    } else {
      console.warn('Cannot run hypothesis node: onRun handler or id missing', { hasOnRun: !!data.onRun, id })
    }
  }

  return (
    <div className={`${styles.hypothesisNode} ${selected ? styles.selected : ''} ${styles[status]}`}>
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
      <div className={styles.nodeContent}>
        <div className={styles.nodeHeader}>
          <span className={styles.nodeEmoji}>💡</span>
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
