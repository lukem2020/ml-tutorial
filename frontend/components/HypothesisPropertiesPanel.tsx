'use client'

import { X, Trash2, Play, Loader2 } from 'lucide-react'
import { Node } from 'reactflow'
import { useState } from 'react'
import styles from './NodePropertiesPanel.module.css'

interface HypothesisPropertiesPanelProps {
  node: Node
  onUpdate: (updates: Record<string, any>) => void
  onClose: () => void
  onDelete: () => void
  onExecute?: (nodeId: string, hypothesis: string) => Promise<void>
}

export function HypothesisPropertiesPanel({
  node,
  onUpdate,
  onClose,
  onDelete,
  onExecute,
}: HypothesisPropertiesPanelProps) {
  const [hypothesis, setHypothesis] = useState(node.data.hypothesis || '')
  const [isExecuting, setIsExecuting] = useState(false)
  const requiredData = node.data.requiredData || []

  const handleSave = () => {
    onUpdate({
      hypothesis,
    })
  }

  const handleExecute = async () => {
    if (!hypothesis.trim() || !onExecute) return
    
    setIsExecuting(true)
    onUpdate({ status: 'running' })
    
    try {
      await onExecute(node.id, hypothesis)
    } catch (error) {
      console.error('Execution error:', error)
      onUpdate({ status: 'pending' })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>Hypothesis Generation</h3>
        <div className={styles.panelActions}>
          <button
            className={styles.deleteButton}
            onClick={onDelete}
            title="Delete node"
          >
            <Trash2 size={16} />
          </button>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={styles.panelContent}>
        <div className={styles.field}>
          <label>Hypothesis *</label>
          <textarea
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            onBlur={handleSave}
            className={styles.textarea}
            rows={4}
            placeholder="Enter your hypothesis about the disease and potential therapeutic approach..."
          />
          <div className={styles.helpText}>
            Enter a concise hypothesis about the disease mechanism and potential therapeutic target.
          </div>
        </div>

        <div className={styles.field}>
          <button
            onClick={handleExecute}
            disabled={!hypothesis.trim() || isExecuting}
            className={styles.executeButton}
          >
            {isExecuting ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                Analyzing...
              </>
            ) : (
              <>
                <Play size={16} />
                Analyze Hypothesis
              </>
            )}
          </button>
        </div>

        {requiredData.length > 0 && (
          <div className={styles.field}>
            <label>Required Data Types</label>
            <div className={styles.dataTypesList}>
              {requiredData.map((dataType: string, index: number) => (
                <div key={index} className={styles.dataTypeBadge}>
                  {dataType}
                </div>
              ))}
            </div>
            <div className={styles.helpText}>
              Connect data collection nodes to gather this evidence.
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label>Node ID</label>
          <input
            type="text"
            value={node.id}
            disabled
            className={styles.input}
          />
        </div>
      </div>
    </div>
  )
}
