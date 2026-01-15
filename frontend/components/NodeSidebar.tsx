'use client'

import { X, Database, Zap, Filter, Search, Settings, FileText, FlaskConical, Target, Dna, RefreshCw, Activity, Network, TestTube, Rocket } from 'lucide-react'
import styles from './NodeSidebar.module.css'

interface NodeSidebarProps {
  onClose: () => void
}

const nodeCategories = [
  {
    name: 'Drug Discovery Workflow',
    icon: FlaskConical,
    nodes: [
      { 
        type: 'Hypothesis Generation & Disease Understanding', 
        icon: FileText,
        isParent: true,
        description: 'Stage 1: Define biological question and understand disease context'
      },
      { 
        type: 'Target Identification', 
        icon: Target,
        isParent: true,
        description: 'Stage 2: Nominate potential therapeutic targets'
      },
      { 
        type: 'Target Prioritization & Druggability Assessment', 
        icon: Search,
        isParent: true,
        description: 'Stage 3: Evaluate and prioritize targets'
      },
      { 
        type: 'Structure Analysis & Modeling', 
        icon: Dna,
        isParent: true,
        description: 'Stage 4: Obtain and analyze 3D protein structures'
      },
      { 
        type: 'Virtual Screening & Hit Identification', 
        icon: Search,
        isParent: true,
        description: 'Stage 5: Screen compound libraries virtually'
      },
      { 
        type: 'Hit-to-Lead Optimization', 
        icon: RefreshCw,
        isParent: true,
        description: 'Stage 6: Refine hits to generate leads'
      },
      { 
        type: 'ADMET Prediction', 
        icon: Activity,
        isParent: true,
        description: 'Stage 7: Predict pharmacokinetics and toxicity'
      },
      { 
        type: 'Systems Biology & Pathway Analysis', 
        icon: Network,
        isParent: true,
        description: 'Stage 8: Model system-wide effects'
      },
      { 
        type: 'Experimental Validation', 
        icon: TestTube,
        isParent: true,
        description: 'Stage 9: Validate predictions experimentally'
      },
      { 
        type: 'Clinical Candidate Selection & Optimization', 
        icon: Rocket,
        isParent: true,
        description: 'Stage 10: Select and optimize clinical candidates'
      },
    ],
  },
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
              <category.icon size={16} />
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
