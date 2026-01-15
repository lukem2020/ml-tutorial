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
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes]
  )

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
            nodes={nodes}
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
