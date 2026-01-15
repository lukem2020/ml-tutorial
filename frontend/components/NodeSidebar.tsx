'use client'

import { X } from 'lucide-react'
import styles from './NodeSidebar.module.css'

interface NodeSidebarProps {
  onClose: () => void
}

const nodeEmojiMap: Record<string, string> = {
  'Hypothesis Generation': '💡',
  'Literature Search': '📚',
  'GWAS Data': '🧬',
  'Expression Data': '📊',
  'Pathway Data': '🔄',
  'Hypothesis Generation & Disease Understanding': '💡',
  'Target Identification': '🎯',
  'Target Prioritization & Druggability Assessment': '🔍',
  'Structure Analysis & Modeling': '🧬',
  'Virtual Screening & Hit Identification': '🔬',
  'Hit-to-Lead Optimization': '⚗️',
  'ADMET Prediction': '📊',
  'Systems Biology & Pathway Analysis': '🔄',
  'Experimental Validation': '🧪',
  'Clinical Candidate Selection & Optimization': '🚀',
  'Data Input': '📥',
  'Data Output': '📤',
  'File Read': '📖',
  'File Write': '💾',
  'Transform': '⚡',
  'Filter': '🔍',
  'Search': '🔎',
  'Wait': '⏳',
  'Set Variable': '⚙️',
  'Schedule Trigger': '⏰',
  'Chat Message Trigger': '⚡',
}

const nodeCategories = [
  {
    name: 'Triggers',
    emoji: '⚡',
    nodes: [
      { 
        type: 'Schedule Trigger', 
        isParent: false,
        description: 'Trigger workflow on a schedule'
      },
      { 
        type: 'Chat Message Trigger', 
        isParent: false,
        description: 'Trigger workflow when a chat message is received'
      },
    ],
  },
  {
    name: 'Stage 1: Hypothesis & Data',
    emoji: '💡',
    nodes: [
      { 
        type: 'Hypothesis Generation', 
        isParent: false,
        description: 'Define and analyze your hypothesis'
      },
      { 
        type: 'Literature Search', 
        isParent: false,
        description: 'Search PubMed and literature databases'
      },
      { 
        type: 'GWAS Data', 
        isParent: false,
        description: 'Retrieve genetic association data'
      },
      { 
        type: 'Expression Data', 
        isParent: false,
        description: 'Get gene expression datasets'
      },
      { 
        type: 'Pathway Data', 
        isParent: false,
        description: 'Access pathway and network data'
      },
    ],
  },
  {
    name: 'Drug Discovery Workflow',
    emoji: '⚗️',
    nodes: [
      { 
        type: 'Hypothesis Generation & Disease Understanding', 
        isParent: true,
        description: 'Stage 1: Define biological question and understand disease context'
      },
      { 
        type: 'Target Identification', 
        isParent: true,
        description: 'Stage 2: Nominate potential therapeutic targets'
      },
      { 
        type: 'Target Prioritization & Druggability Assessment', 
        isParent: true,
        description: 'Stage 3: Evaluate and prioritize targets'
      },
      { 
        type: 'Structure Analysis & Modeling', 
        isParent: true,
        description: 'Stage 4: Obtain and analyze 3D protein structures'
      },
      { 
        type: 'Virtual Screening & Hit Identification', 
        isParent: true,
        description: 'Stage 5: Screen compound libraries virtually'
      },
      { 
        type: 'Hit-to-Lead Optimization', 
        isParent: true,
        description: 'Stage 6: Refine hits to generate leads'
      },
      { 
        type: 'ADMET Prediction', 
        isParent: true,
        description: 'Stage 7: Predict pharmacokinetics and toxicity'
      },
      { 
        type: 'Systems Biology & Pathway Analysis', 
        isParent: true,
        description: 'Stage 8: Model system-wide effects'
      },
      { 
        type: 'Experimental Validation', 
        isParent: true,
        description: 'Stage 9: Validate predictions experimentally'
      },
      { 
        type: 'Clinical Candidate Selection & Optimization', 
        isParent: true,
        description: 'Stage 10: Select and optimize clinical candidates'
      },
    ],
  },
  {
    name: 'Data',
    emoji: '📦',
    nodes: [
      { type: 'Data Input' },
      { type: 'Data Output' },
      { type: 'File Read' },
      { type: 'File Write' },
    ],
  },
  {
    name: 'Processing',
    emoji: '⚡',
    nodes: [
      { type: 'Transform' },
      { type: 'Filter' },
      { type: 'Search' },
    ],
  },
  {
    name: 'System',
    emoji: '⚙️',
    nodes: [
      { type: 'Wait' },
      { type: 'Set Variable' },
    ],
  },
]

export function NodeSidebar({ onClose }: NodeSidebarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string, isParent?: boolean) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('application/reactflow/type', isParent ? 'parent' : 'custom')
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
              <span className={styles.categoryEmoji}>{category.emoji}</span>
              <span>{category.name}</span>
            </div>
            <div className={styles.nodeList}>
              {category.nodes.map((node) => (
                <div
                  key={node.type}
                  className={`${styles.nodeItem} ${node.isParent ? styles.parentNodeItem : ''}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, node.isParent)}
                  title={node.description || node.type}
                >
                  <span className={styles.nodeEmoji}>{nodeEmojiMap[node.type] || '📦'}</span>
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
