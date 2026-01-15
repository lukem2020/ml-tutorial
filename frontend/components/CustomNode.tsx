'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { Database, Zap, Filter, Search, Settings, FileText, X } from 'lucide-react'
import styles from './CustomNode.module.css'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  'Data Input': Database,
  'Data Output': Database,
  'File Read': FileText,
  'File Write': FileText,
  'Transform': Zap,
  'Filter': Filter,
  'Search': Search,
  'Wait': Settings,
  'Set Variable': Settings,
}

export function CustomNode({ data, selected }: NodeProps) {
  const Icon = iconMap[data.type] || Database

  return (
    <div className={`${styles.node} ${selected ? styles.selected : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />
      <div className={styles.nodeContent}>
        <div className={styles.nodeHeader}>
          <Icon size={14} />
          <span className={styles.nodeTitle}>{data.label || data.type}</span>
        </div>
        {data.description && (
          <div className={styles.nodeDescription}>{data.description}</div>
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
