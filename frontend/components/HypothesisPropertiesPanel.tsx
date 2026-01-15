'use client'

import { X, Trash2, Play, Loader2, Shuffle } from 'lucide-react'
import { Node } from 'reactflow'
import { useState } from 'react'
import styles from './NodePropertiesPanel.module.css'

const RANDOM_HYPOTHESES = [
  'NLRP3 inflammasome activation links type 2 diabetes and cardiovascular disease. Targeting NLRP3 may simultaneously improve glycemic control and reduce cardiovascular risk.',
  'BRAF V600E mutations drive resistance to standard kinase inhibitors in melanoma. Dual targeting of BRAF and MEK pathways may overcome resistance mechanisms.',
  'Amyloid-beta aggregation in Alzheimer\'s disease disrupts neuronal calcium homeostasis. Modulating calcium channel activity could slow disease progression.',
  'PD-L1 upregulation in tumor cells suppresses T-cell immunity. Blocking PD-L1/PD-1 interaction may restore anti-tumor immune responses in multiple cancer types.',
  'Alpha-synuclein aggregation in Parkinson\'s disease impairs lysosomal function. Enhancing autophagy pathways may reduce toxic protein accumulation.',
  'KRAS mutations activate downstream PI3K/AKT signaling in pancreatic cancer. Targeting the KRAS-G12C variant may provide therapeutic benefit.',
  'TNF-alpha mediates chronic inflammation in rheumatoid arthritis. Blocking TNF-alpha signaling may reduce joint inflammation and bone erosion.',
  'HER2 overexpression drives aggressive breast cancer growth. Targeting HER2 with monoclonal antibodies may improve patient survival outcomes.',
  'APOE4 allele increases Alzheimer\'s disease risk through impaired lipid metabolism. Modulating lipid pathways may reduce neurodegenerative risk.',
  'IDH1 mutations produce oncometabolite 2-HG in gliomas. Targeting mutant IDH1 may inhibit tumor growth and improve survival.',
  'Beta-amyloid plaques trigger neuroinflammation in Alzheimer\'s disease. Reducing neuroinflammatory pathways may slow cognitive decline.',
  'PCSK9 mutations cause elevated LDL cholesterol and cardiovascular disease. Inhibiting PCSK9 may reduce cardiovascular event risk.',
  'EGFR mutations drive non-small cell lung cancer progression. Targeting mutant EGFR with tyrosine kinase inhibitors may improve outcomes.',
  'IL-6 overproduction in cytokine storm syndromes causes organ damage. Blocking IL-6 signaling may reduce mortality in severe inflammatory states.',
  'Alpha-glucosidase deficiency causes Pompe disease through glycogen accumulation. Enzyme replacement therapy may improve muscle function.',
]

function generateRandomHypothesis(): string {
  return RANDOM_HYPOTHESES[Math.floor(Math.random() * RANDOM_HYPOTHESES.length)]
}

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

  const handleRandomGenerate = () => {
    const randomHyp = generateRandomHypothesis()
    setHypothesis(randomHyp)
    onUpdate({ hypothesis: randomHyp })
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
          <div className={styles.fieldHeader}>
            <label>Hypothesis *</label>
            <button
              onClick={handleRandomGenerate}
              className={styles.randomButton}
              title="Generate random hypothesis"
            >
              <Shuffle size={14} />
              Random
            </button>
          </div>
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
