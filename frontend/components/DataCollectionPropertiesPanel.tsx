'use client'

import { X, Trash2, Play, Loader2, Code, Download, Eye } from 'lucide-react'
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
import urllib.parse
import time

def search_literature(hypothesis):
    """
    Search PubMed for literature related to the hypothesis using NCBI E-utilities API.
    
    Args:
        hypothesis: The hypothesis text to search for
        
    Returns:
        dict: Search results with count, sources, and paper details
    """
    if not hypothesis or not hypothesis.strip():
        return {
            "count": 0,
            "sources": ["PubMed"],
            "papers": [],
            "error": "No hypothesis provided"
        }
    
    # Extract key terms from hypothesis (simple keyword extraction)
    # Remove common words and get meaningful terms
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'}
    words = hypothesis.lower().split()
    keywords = [w for w in words if len(w) > 3 and w not in stop_words]
    query_terms = ' '.join(keywords[:10])  # Limit to 10 keywords
    
    # If no keywords extracted, use the full hypothesis
    if not query_terms:
        query_terms = hypothesis[:200]  # Limit length
    
    try:
        # Step 1: Search PubMed using E-utilities esearch
        base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
        search_url = f"{base_url}/esearch.fcgi"
        
        search_params = {
            'db': 'pubmed',
            'term': query_terms,
            'retmax': 20,  # Get up to 20 results
            'retmode': 'json',
            'sort': 'relevance'
        }
        
        # Make search request
        response = requests.get(search_url, params=search_params, timeout=10)
        response.raise_for_status()
        
        search_data = response.json()
        pmids = search_data.get('esearchresult', {}).get('idlist', [])
        total_count = int(search_data.get('esearchresult', {}).get('count', 0))
        
        if not pmids:
            return {
                "count": 0,
                "sources": ["PubMed"],
                "papers": [],
                "query": query_terms,
                "message": "No results found"
            }
        
        # Step 2: Fetch paper details using efetch
        fetch_url = f"{base_url}/efetch.fcgi"
        fetch_params = {
            'db': 'pubmed',
            'id': ','.join(pmids),
            'retmode': 'xml',
            'rettype': 'abstract'
        }
        
        # Respect rate limiting (3 requests per second)
        time.sleep(0.34)
        
        fetch_response = requests.get(fetch_url, params=fetch_params, timeout=15)
        fetch_response.raise_for_status()
        
        # Parse XML to extract paper information
        import xml.etree.ElementTree as ET
        root = ET.fromstring(fetch_response.content)
        
        papers = []
        for article in root.findall('.//PubmedArticle'):
            try:
                # Extract title
                title_elem = article.find('.//ArticleTitle')
                title = title_elem.text if title_elem is not None else "No title"
                
                # Extract authors
                authors = []
                for author in article.findall('.//Author'):
                    last_name = author.find('LastName')
                    first_name = author.find('ForeName')
                    if last_name is not None and first_name is not None:
                        authors.append(f"{first_name.text} {last_name.text}")
                
                # Extract journal
                journal_elem = article.find('.//Journal/Title')
                journal = journal_elem.text if journal_elem is not None else "Unknown journal"
                
                # Extract publication date
                pub_date = article.find('.//PubDate')
                year = pub_date.find('Year') if pub_date is not None else None
                year_text = year.text if year is not None else "Unknown"
                
                # Extract PMID
                pmid_elem = article.find('.//PMID')
                pmid = pmid_elem.text if pmid_elem is not None else ""
                
                # Extract abstract
                abstract_elem = article.find('.//AbstractText')
                abstract = abstract_elem.text if abstract_elem is not None else ""
                
                papers.append({
                    "pmid": pmid,
                    "title": title,
                    "authors": authors[:5],  # Limit to first 5 authors
                    "journal": journal,
                    "year": year_text,
                    "abstract": abstract[:500] if abstract else ""  # Limit abstract length
                })
            except Exception as e:
                # Skip articles that can't be parsed
                continue
        
        return {
            "count": len(papers),
            "total_available": total_count,
            "sources": ["PubMed"],
            "papers": papers,
            "query": query_terms,
            "pmids": pmids
        }
        
    except requests.exceptions.RequestException as e:
        return {
            "count": 0,
            "sources": ["PubMed"],
            "papers": [],
            "error": f"API request failed: {str(e)}",
            "query": query_terms
        }
    except Exception as e:
        return {
            "count": 0,
            "sources": ["PubMed"],
            "papers": [],
            "error": f"Error processing results: {str(e)}",
            "query": query_terms
        }

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
  const [showResultsViewer, setShowResultsViewer] = useState(false)
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

  const handleDownloadResults = () => {
    if (!results) return
    
    const jsonString = JSON.stringify(results, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `literature-search-results-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleViewResults = () => {
    setShowResultsViewer(true)
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
            <div className={styles.fieldHeader}>
              <label>Last Results</label>
              <div className={styles.resultActions}>
                <button
                  onClick={handleViewResults}
                  className={styles.viewButton}
                  title="View results"
                >
                  <Eye size={14} />
                  View
                </button>
                <button
                  onClick={handleDownloadResults}
                  className={styles.downloadButton}
                  title="Download JSON"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>
            <div className={styles.resultsDisplay}>
              <div className={styles.resultCount}>
                Found: {results.count} result{results.count !== 1 ? 's' : ''}
                {results.total_available && (
                  <span className={styles.totalAvailable}>
                    {' '}({results.total_available} total available)
                  </span>
                )}
              </div>
              {results.sources && (
                <div className={styles.resultSources}>
                  Sources: {results.sources.join(', ')}
                </div>
              )}
              {results.query && (
                <div className={styles.resultQuery}>
                  Query: {results.query}
                </div>
              )}
            </div>
          </div>
        )}

        {showResultsViewer && results && (
          <div className={styles.jsonViewer}>
            <div className={styles.jsonViewerHeader}>
              <h4>Search Results (JSON)</h4>
              <button
                onClick={() => setShowResultsViewer(false)}
                className={styles.closeButton}
                title="Close viewer"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.jsonContent}>
              <pre>{JSON.stringify(results, null, 2)}</pre>
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
