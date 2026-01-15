'use client'

import { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { NodeSidebar } from './NodeSidebar'
import { NodePropertiesPanel } from './NodePropertiesPanel'
import { HypothesisPropertiesPanel } from './HypothesisPropertiesPanel'
import { DataCollectionPropertiesPanel } from './DataCollectionPropertiesPanel'
import { CustomNode } from './CustomNode'
import { ParentNode } from './ParentNode'
import { HypothesisNode } from './HypothesisNode'
import { DataCollectionNode } from './DataCollectionNode'
import { Toolbar } from './Toolbar'
import styles from './WorkflowEditor.module.css'

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  parent: ParentNode,
  hypothesis: HypothesisNode,
  dataCollection: DataCollectionNode,
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export function WorkflowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Wrap onNodesChange to ensure onRun handler is always present
  const wrappedOnNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes)
      // After changes, ensure all nodes have onRun handler
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onRun: handleNodeRun,
          },
        }))
      )
    },
    [onNodesChange, setNodes]
  )

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setIsPropertiesOpen(true)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setIsPropertiesOpen(false)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const getNodeTypeFromLabel = (label: string): string => {
    if (label === 'Hypothesis Generation') return 'hypothesis'
    if (['Literature Search', 'GWAS Data', 'Expression Data', 'Pathway Data', 'Omics Data'].includes(label)) {
      return 'dataCollection'
    }
    return 'custom'
  }

  const executeHypothesisAnalysis = useCallback(
    async (nodeId: string, hypothesis: string) => {
      try {
        const response = await fetch('/api/nodes/analyze-hypothesis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hypothesis }),
        })

        if (!response.ok) {
          throw new Error('Failed to analyze hypothesis')
        }

        const result = await response.json()

        // Update the node with the results
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    hypothesis,
                    requiredData: result.requiredData,
                    status: result.status,
                  },
                }
              : node
          )
        )

        // Update selected node if it's the one we just updated
        if (selectedNode?.id === nodeId) {
          setSelectedNode({
            ...selectedNode,
            data: {
              ...selectedNode.data,
              hypothesis,
              requiredData: result.requiredData,
              status: result.status,
            },
          })
        }
      } catch (error) {
        console.error('Error executing hypothesis analysis:', error)
        throw error
      }
    },
    [setNodes, selectedNode]
  )

  const executeDataCollection = useCallback(
    async (nodeId: string, dataType: string, query: string, script?: string) => {
      try {
        const node = nodes.find((n) => n.id === nodeId)
        if (!node) return

        // Get hypothesis from connected upstream node if query is empty
        let searchQuery = query
        if (!searchQuery) {
          const incomingEdge = edges.find((e) => e.target === nodeId)
          if (incomingEdge) {
            const sourceNode = nodes.find((n) => n.id === incomingEdge.source)
            if (sourceNode?.data.hypothesis) {
              searchQuery = sourceNode.data.hypothesis
            }
          }
        }

        // Update node status to running
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: 'running',
                  },
                }
              : n
          )
        )

        // Use custom script if provided, otherwise use mock
        const nodeScript = script || node.data.script
        let results

        if (nodeScript) {
          // Execute Python script via API
          const response = await fetch('/api/nodes/execute-script', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              script: nodeScript,
              query: searchQuery || '',
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to execute script')
          }

          const result = await response.json()
          results = result.results
        } else {
          // Fallback to mock results
          await new Promise((resolve) => setTimeout(resolve, 2000))

          const mockResults = {
            'Literature Search': { count: Math.floor(Math.random() * 100) + 10, sources: ['PubMed', 'PMC'] },
            'GWAS Data': { count: Math.floor(Math.random() * 50) + 5, variants: [] },
            'Expression Data': { count: Math.floor(Math.random() * 200) + 20, datasets: [] },
            'Pathway Data': { count: Math.floor(Math.random() * 30) + 5, pathways: [] },
          }

          results = mockResults[dataType as keyof typeof mockResults] || { count: 0 }
        }

        // Update the node with results
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    results,
                    status: 'completed',
                    query: searchQuery,
                  },
                }
              : n
          )
        )

        if (selectedNode?.id === nodeId) {
          setSelectedNode({
            ...selectedNode,
            data: {
              ...selectedNode.data,
              results,
              status: 'completed',
              query: searchQuery,
            },
          })
        }
      } catch (error) {
        console.error('Error executing data collection:', error)
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: 'pending',
                  },
                }
              : n
          )
        )
      }
    },
    [nodes, edges, setNodes, selectedNode]
  )

  const handleNodeRun = useCallback(
    (nodeIdOrEmpty: string, dataType?: string, script?: string, query?: string) => {
      // Get nodeId from first argument or find from nodes
      const nodeId = nodeIdOrEmpty || (dataType && nodes.find(n => n.data.dataType === dataType)?.id) || ''
      const node = nodes.find((n) => n.id === nodeId)
      
      if (!node) {
        console.warn('Node not found for execution:', nodeId)
        return
      }

      if (node.type === 'hypothesis') {
        // For hypothesis: nodeId, hypothesis (second arg is the hypothesis text)
        executeHypothesisAnalysis(nodeId, dataTypeOrHypothesis || node.data.hypothesis || '')
      } else if (node.type === 'dataCollection') {
        executeDataCollection(
          nodeId,
          dataType || node.data.dataType,
          query || node.data.query || '',
          script || node.data.script
        )
      } else {
        // Generic node execution
        console.log('Running node:', nodeId, node.type)
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: 'running',
                  },
                }
              : n
          )
        )
        // Simulate execution
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      status: 'completed',
                    },
                  }
                : n
            )
          )
        }, 1500)
      }
    },
    [nodes, setNodes, executeHypothesisAnalysis, executeDataCollection]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      const nodeType = event.dataTransfer.getData('application/reactflow/type') || 'custom'
      
      if (!type || !reactFlowWrapper.current) {
        return
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }

      const actualNodeType = nodeType === 'parent' ? 'parent' : getNodeTypeFromLabel(type)

      const newNode: Node = {
        id: `${type.replace(/\s+/g, '-')}-${Date.now()}`,
        type: actualNodeType,
        position,
        data: {
          label: type,
          type: type,
          childrenCount: actualNodeType === 'parent' ? 0 : undefined,
          status: 'pending',
          dataType: actualNodeType === 'dataCollection' ? type : undefined,
          onRun: handleNodeRun,
        },
      }

      // If it's a Hypothesis Generation node, automatically create connected data nodes
      if (type === 'Hypothesis Generation') {
        const dataNodes: Node[] = [
          {
            id: `Literature-Search-${Date.now()}`,
            type: 'dataCollection',
            position: { x: position.x - 180, y: position.y + 120 },
            data: {
              label: 'Literature Search',
              type: 'Literature Search',
              status: 'pending',
              dataType: 'Literature Search',
              onRun: handleNodeRun,
            },
          },
          {
            id: `GWAS-Data-${Date.now()}`,
            type: 'dataCollection',
            position: { x: position.x - 60, y: position.y + 120 },
            data: {
              label: 'GWAS Data',
              type: 'GWAS Data',
              status: 'pending',
              dataType: 'GWAS Data',
              onRun: handleNodeRun,
            },
          },
          {
            id: `Expression-Data-${Date.now()}`,
            type: 'dataCollection',
            position: { x: position.x + 60, y: position.y + 120 },
            data: {
              label: 'Expression Data',
              type: 'Expression Data',
              status: 'pending',
              dataType: 'Expression Data',
              onRun: handleNodeRun,
            },
          },
          {
            id: `Pathway-Data-${Date.now()}`,
            type: 'dataCollection',
            position: { x: position.x + 180, y: position.y + 120 },
            data: {
              label: 'Pathway Data',
              type: 'Pathway Data',
              status: 'pending',
              dataType: 'Pathway Data',
              onRun: handleNodeRun,
            },
          },
        ]

        // Create edges from hypothesis node to each data node
        const newEdges: Edge[] = dataNodes.map((dataNode) => ({
          id: `${newNode.id}-${dataNode.id}`,
          source: newNode.id,
          target: dataNode.id,
          type: 'smoothstep',
          animated: false,
        }))

        setNodes((nds) => nds.concat([newNode, ...dataNodes]))
        setEdges((eds) => eds.concat(newEdges))
      } else {
        setNodes((nds) => nds.concat(newNode))
      }
    },
    [setNodes, setEdges, handleNodeRun]
  )

  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
        )
      )
      setSelectedNode(null)
      setIsPropertiesOpen(false)
    }
  }, [selectedNode, setNodes, setEdges])

  return (
    <div className={styles.editorContainer}>
      <Toolbar
        onSave={() => console.log('Save workflow')}
        onLoad={() => console.log('Load workflow')}
        onExecute={() => console.log('Execute workflow')}
      />
      
      <div className={styles.mainContent}>
        {isSidebarOpen && (
          <NodeSidebar onClose={() => setIsSidebarOpen(false)} />
        )}
        
        {!isSidebarOpen && (
          <button
            className={styles.sidebarToggle}
            onClick={() => setIsSidebarOpen(true)}
          >
            ▶
          </button>
        )}

        <div
          ref={reactFlowWrapper}
          className={styles.flowContainer}
        >
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                id: node.id,
                onRun: handleNodeRun,
              },
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {isPropertiesOpen && selectedNode && (
          selectedNode.type === 'hypothesis' ? (
            <HypothesisPropertiesPanel
              node={selectedNode}
              onUpdate={(updates) => {
                setNodes((nds) =>
                  nds.map((node) =>
                    node.id === selectedNode.id
                      ? { ...node, data: { ...node.data, ...updates } }
                      : node
                  )
                )
                setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...updates } })
              }}
              onClose={() => {
                setIsPropertiesOpen(false)
                setSelectedNode(null)
              }}
              onDelete={deleteSelectedNode}
              onExecute={executeHypothesisAnalysis}
            />
          ) : selectedNode.type === 'dataCollection' ? (
            <DataCollectionPropertiesPanel
              node={selectedNode}
              onUpdate={(updates) => {
                setNodes((nds) =>
                  nds.map((node) =>
                    node.id === selectedNode.id
                      ? { ...node, data: { ...node.data, ...updates } }
                      : node
                  )
                )
                setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...updates } })
              }}
              onClose={() => {
                setIsPropertiesOpen(false)
                setSelectedNode(null)
              }}
              onDelete={deleteSelectedNode}
              onExecute={(nodeId, script, query) =>
                executeDataCollection(nodeId, selectedNode.data.dataType, query, script)
              }
            />
          ) : (
            <NodePropertiesPanel
              node={selectedNode}
              onUpdate={(updates) => {
                setNodes((nds) =>
                  nds.map((node) =>
                    node.id === selectedNode.id
                      ? { ...node, data: { ...node.data, ...updates } }
                      : node
                  )
                )
                setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...updates } })
              }}
              onClose={() => {
                setIsPropertiesOpen(false)
                setSelectedNode(null)
              }}
              onDelete={deleteSelectedNode}
            />
          )
        )}
      </div>
    </div>
  )
}
