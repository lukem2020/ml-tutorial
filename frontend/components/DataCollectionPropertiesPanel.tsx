'use client'

import { X, Trash2, Play, Loader2, Code } from 'lucide-react'
import { Node } from 'reactflow'
import { useState } from 'react'
import styles from './NodePropertiesPanel.module.css'

interface DataCollectionPropertiesPanelProps {
  node: Node
  onUpdate: (updates: Record<string, any>) => void
  onClose: () => void
  onDelete: () => void
  onExecute?: (nodeId: string, script: string, query: string) => Promise<void>
}

const DEFAULT_LITERATURE_SEARCH_SCRIPT = `import requests
import json

def search_literature(hypothesis):
    """
    Search PubMed for literature related to the hypothesis.
    
    Args:
        hypothesis: The hypothesis text to search for
        
    Returns:
        dict: Search results with count and sources
    """
    # Extract key terms from hypothesis
    query = hypothesis.lower()
    
    # Simple PubMed search (you can enhance this with actual API)
    # For now, return mock data structure
    results = {
        "count": 0,
        "sources": ["PubMed", "PMC"],
        "papers": []
    }
    
    # TODO: Implement actual PubMed API integration
    # Example: Use BioPython or requests to query NCBI E-utilities
    
    return results

# This will be executed when node runs
if __name__ == "__main__":
    import sys
    hypothesis = sys.argv[1] if len(sys.argv) > 1 else ""
    results = search_literature(hypothesis)
    print(json.dumps(results))`

const DEFAULT_SCRIPTS: Record<string, string> = {
  'Literature Search': DEFAULT_LITERATURE_SEARCH_SCRIPT,
  'GWAS Data': `import json

def fetch_gwas_data(query):
    """
    Fetch GWAS data for given query terms.
    """
    # TODO: Implement GWAS catalog API integration
    return {"count": 0, "variants": []}

if __name__ == "__main__":
    import sys
    query = sys.argv[1] if len(sys.argv) > 1 else ""
    results = fetch_gwas_data(query)
    print(json.dumps(results))`,
  'Expression Data': `import json

def fetch_expression_data(query):
    """
    Fetch gene expression data.
    """
    # TODO: Implement GEO or GTEx API integration
    return {"count": 0, "datasets": []}

if __name__ == "__main__":
    import sys
    query = sys.argv[1] if len(sys.argv) > 1 else ""
    results = fetch_expression_data(query)
    print(json.dumps(results))`,
  'Pathway Data': `import json

def fetch_pathway_data(query):
    """
    Fetch pathway and network data.
    """
    # TODO: Implement KEGG/Reactome API integration
    return {"count": 0, "pathways": []}

if __name__ == "__main__":
    import sys
    query = sys.argv[1] if len(sys.argv) > 1 else ""
    results = fetch_pathway_data(query)
    print(json.dumps(results))`,
}

export function DataCollectionPropertiesPanel({
  node,
  onUpdate,
  onClose,
  onDelete,
  onExecute,
}: DataCollectionPropertiesPanelProps) {
  const dataType = node.data.dataType || node.data.type
  const [script, setScript] = useState(
    node.data.script || DEFAULT_SCRIPTS[dataType] || DEFAULT_LITERATURE_SEARCH_SCRIPT
  )
  const [query, setQuery] = useState(node.data.query || '')
  const [isExecuting, setIsExecuting] = useState(false)
  const results = node.data.results

  const handleSave = () => {
    onUpdate({
      script,
      query,
    })
  }

  const handleExecute = async () => {
    if (!onExecute) return

    setIsExecuting(true)
    onUpdate({ status: 'running' })

    try {
      await onExecute(node.id, script, query)
    } catch (error) {
      console.error('Execution error:', error)
      onUpdate({ status: 'pending' })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleResetScript = () => {
    const defaultScript = DEFAULT_SCRIPTS[dataType] || DEFAULT_LITERATURE_SEARCH_SCRIPT
    setScript(defaultScript)
    onUpdate({ script: defaultScript })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>{dataType}</h3>
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
          <label>Search Query (optional)</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={handleSave}
            className={styles.input}
            placeholder="Enter search query or leave empty to use hypothesis"
          />
          <div className={styles.helpText}>
            If empty, will use hypothesis from connected upstream node.
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label>
              <Code size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Python Script
            </label>
            <button
              onClick={handleResetScript}
              className={styles.randomButton}
              title="Reset to default script"
            >
              Reset
            </button>
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            onBlur={handleSave}
            className={styles.codeTextarea}
            rows={15}
            placeholder="Enter Python script for data collection..."
          />
          <div className={styles.helpText}>
            Python script that will be executed. Use sys.argv[1] to receive the hypothesis/query.
            Must print JSON results to stdout.
          </div>
        </div>

        <div className={styles.field}>
          <button
            onClick={handleExecute}
            disabled={isExecuting || !script.trim()}
            className={styles.executeButton}
          >
            {isExecuting ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                Executing...
              </>
            ) : (
              <>
                <Play size={16} />
                Execute Script
              </>
            )}
          </button>
        </div>

        {results && results.count !== undefined && (
          <div className={styles.field}>
            <label>Last Results</label>
            <div className={styles.resultsDisplay}>
              <div className={styles.resultCount}>
                Found: {results.count} result{results.count !== 1 ? 's' : ''}
              </div>
              {results.sources && (
                <div className={styles.resultSources}>
                  Sources: {results.sources.join(', ')}
                </div>
              )}
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
