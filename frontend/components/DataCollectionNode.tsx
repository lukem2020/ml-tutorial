'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { Database, Search, BookOpen, Dna, Activity, CheckCircle2, Clock, FileText } from 'lucide-react'
import styles from './DataCollectionNode.module.css'

const dataTypeIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  'Literature Search': BookOpen,
  'GWAS Data': Dna,
  'Omics Data': Dna,
  'Pathway Data': Activity,
  'Expression Data': Activity,
  'Disease Association Data': FileText,
}

export function DataCollectionNode({ data, selected }: NodeProps) {
  const status = data.status || 'pending'
  const dataType = data.dataType || 'Data Collection'
  const Icon = dataTypeIcons[dataType] || Database
  const hasResults = data.results && Object.keys(data.results).length > 0

  return (
    <div className={`${styles.dataNode} ${selected ? styles.selected : ''} ${styles[status]}`}>
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
      />
      <div className={styles.nodeContent}>
        <div className={styles.nodeHeader}>
          <Icon size={14} />
          <span className={styles.nodeTitle}>{dataType}</span>
          {status === 'running' && <Clock size={12} className={styles.statusIcon} />}
          {status === 'completed' && <CheckCircle2 size={12} className={styles.statusIcon} />}
        </div>
        
        {data.query && (
          <div className={styles.queryText}>
            Query: {data.query.length > 50 ? `${data.query.substring(0, 50)}...` : data.query}
          </div>
        )}
        
        {hasResults && (
          <div className={styles.resultsBadge}>
            {data.results.count || 0} result{(data.results.count || 0) !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
        style={{ visibility: hasResults ? 'visible' : 'hidden' }}
      />
    </div>
  )
}
