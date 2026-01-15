'use client'

import { Play, Save, FolderOpen, Menu } from 'lucide-react'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  onSave: () => void
  onLoad: () => void
  onExecute: () => void
}

export function Toolbar({ onSave, onLoad, onExecute }: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <div className={styles.logo}>
          <Menu size={20} />
          <span>Workflow Editor</span>
        </div>
      </div>
      
      <div className={styles.toolbarRight}>
        <button className={styles.toolbarButton} onClick={onLoad} title="Load workflow">
          <FolderOpen size={16} />
          <span>Load</span>
        </button>
        <button className={styles.toolbarButton} onClick={onSave} title="Save workflow">
          <Save size={16} />
          <span>Save</span>
        </button>
        <button className={styles.toolbarButtonPrimary} onClick={onExecute} title="Execute workflow">
          <Play size={16} />
          <span>Execute</span>
        </button>
      </div>
    </div>
  )
}
