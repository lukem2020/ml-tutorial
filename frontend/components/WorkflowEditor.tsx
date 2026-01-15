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
import { CustomNode } from './CustomNode'
import { ParentNode } from './ParentNode'
import { Toolbar } from './Toolbar'
import styles from './WorkflowEditor.module.css'

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  parent: ParentNode,
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

      const newNode: Node = {
        id: `${type.replace(/\s+/g, '-')}-${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: type,
          type: type,
          childrenCount: nodeType === 'parent' ? 0 : undefined,
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes]
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
        )}
      </div>
    </div>
  )
}
