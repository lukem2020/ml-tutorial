'use client'

import { X, Database, Zap, Filter, Search, Settings, FileText } from 'lucide-react'
import styles from './NodeSidebar.module.css'

interface NodeSidebarProps {
  onClose: () => void
}

const nodeCategories = [
  {
    name: 'Data',
    icon: Database,
    nodes: [
      { type: 'Data Input', icon: Database },
      { type: 'Data Output', icon: Database },
      { type: 'File Read', icon: FileText },
      { type: 'File Write', icon: FileText },
    ],
  },
  {
    name: 'Processing',
    icon: Zap,
    nodes: [
      { type: 'Transform', icon: Zap },
      { type: 'Filter', icon: Filter },
      { type: 'Search', icon: Search },
    ],
  },
  {
    name: 'System',
    icon: Settings,
    nodes: [
      { type: 'Wait', icon: Settings },
      { type: 'Set Variable', icon: Settings },
    ],
  },
]

export function NodeSidebar({ onClose }: NodeSidebarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Nodes</h2>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      
      <div className={styles.sidebarContent}>
        {nodeCategories.map((category) => (
          <div key={category.name} className={styles.category}>
            <div className={styles.categoryHeader}>
              <category.icon size={16} />
              <span>{category.name}</span>
            </div>
            <div className={styles.nodeList}>
              {category.nodes.map((node) => (
                <div
                  key={node.type}
                  className={styles.nodeItem}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                >
                  <node.icon size={14} />
                  <span>{node.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
