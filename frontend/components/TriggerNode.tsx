'use client'

import { Handle, Position, NodeProps } from 'reactflow'
import { CheckCircle2, Clock } from 'lucide-react'
import styles from './TriggerNode.module.css'

export function TriggerNode({ id, data, selected }: NodeProps) {
  const status = data.status || 'pending'
  const triggerType = data.triggerType || (data.type === 'Chat Message Trigger' ? 'chat' : 'schedule')
  const schedule = data.schedule || 'Every 5 minutes'
  const emoji = triggerType === 'chat' ? '⚡' : '⏰'
  
  return (
    <div className={`${styles.triggerNode} ${selected ? styles.selected : ''} ${styles[status]}`}>
      <div className={styles.nodeContent}>
        <div className={styles.nodeHeader}>
          <span className={styles.nodeEmoji}>{emoji}</span>
          <span className={styles.nodeTitle}>{data.label || data.type || 'Schedule Trigger'}</span>
          {status === 'running' && <Clock size={12} className={styles.statusIcon} />}
          {status === 'completed' && <CheckCircle2 size={12} className={styles.statusIcon} />}
        </div>
        
        {triggerType === 'schedule' && (
          <div className={styles.scheduleInfo}>
            <span className={styles.scheduleLabel}>Schedule:</span>
            <span className={styles.scheduleValue}>{schedule}</span>
          </div>
        )}
        
        {triggerType === 'chat' && data.webhookId && (
          <div className={styles.webhookInfo}>
            <span className={styles.webhookLabel}>Webhook ID:</span>
            <span className={styles.webhookId}>{data.webhookId.substring(0, 8)}...</span>
          </div>
        )}
        
        {data.description && (
          <div className={styles.description}>{data.description}</div>
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
      <Handle
        type="source"
        position={Position.Left}
        className={styles.handle}
        id="source-left"
      />
    </div>
  )
}
