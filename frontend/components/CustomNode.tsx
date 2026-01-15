'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { Play } from 'lucide-react'
import styles from './CustomNode.module.css'

const emojiMap: Record<string, string> = {
  'Data Input': '📥',
  'Data Output': '📤',
  'File Read': '📖',
  'File Write': '💾',
  'Transform': '⚡',
  'Filter': '🔍',
  'Search': '🔎',
  'Wait': '⏳',
  'Set Variable': '⚙️',
}

export function CustomNode({ id, data, selected }: NodeProps) {
  const emoji = emojiMap[data.type] || '📦'
  const status = data.status || 'pending'

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (data.onRun && id) {
      data.onRun(id, data.type)
    }
  }

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
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
          <span className={styles.nodeEmoji}>{emoji}</span>
          <span className={styles.nodeTitle}>{data.label || data.type}</span>
          <button
            className={styles.runButton}
            onClick={handleRun}
            disabled={status === 'running'}
            title="Run node"
          >
            <Play size={10} />
          </button>
        </div>
        {data.description && (
          <div className={styles.nodeDescription}>{data.description}</div>
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
