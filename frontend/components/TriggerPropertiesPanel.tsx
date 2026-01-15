'use client'

import { X, Trash2 } from 'lucide-react'
import { Node } from 'reactflow'
import { useState } from 'react'
import styles from './TriggerPropertiesPanel.module.css'

interface TriggerPropertiesPanelProps {
  node: Node
  onUpdate: (updates: Record<string, any>) => void
  onClose: () => void
  onDelete: () => void
}

const schedulePresets = [
  'Every 1 minute',
  'Every 5 minutes',
  'Every 15 minutes',
  'Every 30 minutes',
  'Every 1 hour',
  'Every 6 hours',
  'Every 12 hours',
  'Every 1 day',
  'Every week',
  'Every month',
]

export function TriggerPropertiesPanel({
  node,
  onUpdate,
  onClose,
  onDelete,
}: TriggerPropertiesPanelProps) {
  const triggerType = node.data.triggerType || 'schedule'
  const [label, setLabel] = useState(node.data.label || node.data.type)
  const [description, setDescription] = useState(node.data.description || '')
  const [schedule, setSchedule] = useState(node.data.schedule || 'Every 5 minutes')
  const [customSchedule, setCustomSchedule] = useState(node.data.customSchedule || '')

  const handleSave = () => {
    onUpdate({
      label,
      description,
      schedule,
      customSchedule,
    })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>Trigger Properties</h3>
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
          <label>Trigger Type</label>
          <select
            value={triggerType}
            onChange={(e) => {
              onUpdate({ triggerType: e.target.value })
            }}
            className={styles.select}
          >
            <option value="schedule">Schedule Trigger</option>
            <option value="chat">Chat Message Trigger</option>
          </select>
        </div>

        {triggerType === 'schedule' && (
          <>
            <div className={styles.field}>
              <label>Schedule Preset</label>
              <select
                value={schedule}
                onChange={(e) => {
                  setSchedule(e.target.value)
                  onUpdate({ schedule: e.target.value })
                }}
                className={styles.select}
              >
                {schedulePresets.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
                <option value="custom">Custom (Cron Expression)</option>
              </select>
            </div>

            {schedule === 'custom' && (
              <div className={styles.field}>
                <label>Custom Cron Expression</label>
                <input
                  type="text"
                  value={customSchedule}
                  onChange={(e) => setCustomSchedule(e.target.value)}
                  onBlur={handleSave}
                  placeholder="0 */5 * * * *"
                  className={styles.input}
                />
                <p className={styles.helpText}>
                  Format: second minute hour day month dayOfWeek
                  <br />
                  Example: "0 */5 * * * *" = Every 5 minutes
                </p>
              </div>
            )}
          </>
        )}

        {triggerType === 'chat' && node.data.webhookId && (
          <div className={styles.field}>
            <label>Webhook ID</label>
            <div className={styles.webhookDisplay}>
              <code className={styles.webhookCode}>{node.data.webhookId}</code>
              <button
                className={styles.copyButton}
                onClick={() => {
                  navigator.clipboard.writeText(node.data.webhookId || '')
                }}
                title="Copy webhook ID"
              >
                📋
              </button>
            </div>
            <p className={styles.helpText}>
              Use this webhook ID to configure your chat integration
            </p>
          </div>
        )}

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
