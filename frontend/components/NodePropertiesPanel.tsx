'use client'

import { X, Trash2 } from 'lucide-react'
import { Node } from 'reactflow'
import { useState } from 'react'
import styles from './NodePropertiesPanel.module.css'

interface NodePropertiesPanelProps {
  node: Node
  onUpdate: (updates: Record<string, any>) => void
  onClose: () => void
  onDelete: () => void
}

export function NodePropertiesPanel({
  node,
  onUpdate,
  onClose,
  onDelete,
}: NodePropertiesPanelProps) {
  const [label, setLabel] = useState(node.data.label || node.data.type)
  const [description, setDescription] = useState(node.data.description || '')

  const handleSave = () => {
    onUpdate({
      label,
      description,
    })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>Node Properties</h3>
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
          <label>Node Type</label>
          <input
            type="text"
            value={node.data.type}
            disabled
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            className={styles.textarea}
            rows={3}
          />
        </div>

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
