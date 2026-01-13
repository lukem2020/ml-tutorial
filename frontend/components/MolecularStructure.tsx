'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import styles from './MolecularStructure.module.css'

interface MolecularStructureProps {
  moleculeName: string
  smiles?: string
  pdbData?: string
}

interface ParsedAtom {
  element: string
  position: [number, number, number]
  index: number
  neighbors: number[]
  aromatic?: boolean
}

interface ParsedBond {
  from: number
  to: number
  order: number
}

// Advanced SMILES parser with proper structure extraction
function parseSMILES(smiles: string): { atoms: ParsedAtom[], bonds: ParsedBond[] } {
  const atoms: ParsedAtom[] = []
  const bonds: ParsedBond[] = []
  const atomStack: number[] = [] // For branches
  const ringMap = new Map<number, { atom: number, bondOrder: number }>() // For ring closures
  let currentAtom = -1
  let prevAtom = -1
  let bondOrder = 1
  
  // Element symbols
  const elements = new Set(['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 
    'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Br', 'I'])
  
  // Parse SMILES
  let i = 0
  while (i < smiles.length) {
    const char = smiles[i]
    const nextChar = i < smiles.length - 1 ? smiles[i + 1] : ''
    const prevChar = i > 0 ? smiles[i - 1] : ''
    
    // Handle element symbols
    if (char.match(/[A-Z]/)) {
      let element = char
      let isAromatic = false
      
      // Check for two-letter elements
      if (nextChar && nextChar.match(/[a-z]/) && !['c', 'n', 'o', 's'].includes(nextChar)) {
        element = char + nextChar
        i++
      } else if (nextChar && ['c', 'n', 'o', 's'].includes(nextChar)) {
        // Aromatic atom
        element = nextChar.toUpperCase()
        isAromatic = true
        i++
      }
      
      // Handle lowercase aromatic (b, c, n, o, s, p)
      if (char.match(/[a-z]/) && ['b', 'c', 'n', 'o', 's', 'p'].includes(char)) {
        element = char.toUpperCase()
        isAromatic = true
      }
      
      // Create atom
      if (elements.has(element) || ['C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I', 'H'].includes(element)) {
        const atom: ParsedAtom = {
          element: element,
          position: [0, 0, 0],
          index: atoms.length,
          neighbors: [],
          aromatic: isAromatic
        }
        atoms.push(atom)
        
        // Create bond to previous atom
        if (prevAtom >= 0 && currentAtom >= 0) {
          bonds.push({ from: prevAtom, to: currentAtom, order: bondOrder })
          atoms[prevAtom].neighbors.push(currentAtom)
          atoms[currentAtom].neighbors.push(prevAtom)
          bondOrder = 1 // Reset bond order
        }
        
        prevAtom = currentAtom
        currentAtom = atoms.length - 1
      }
    }
    // Handle branches '('
    else if (char === '(') {
      atomStack.push(currentAtom)
    }
    // Handle branch closure ')'
    else if (char === ')') {
      if (atomStack.length > 0) {
        currentAtom = atomStack.pop()!
        prevAtom = currentAtom
      }
    }
    // Handle ring closures (numbers)
    else if (char.match(/[0-9]/)) {
      const ringNum = parseInt(char)
      if (!ringMap.has(ringNum)) {
        ringMap.set(ringNum, { atom: currentAtom, bondOrder: bondOrder })
        bondOrder = 1
      } else {
        // Create bond for ring closure
        const ringInfo = ringMap.get(ringNum)!
        const fromAtom = ringInfo.atom
        const toAtom = currentAtom
        if (fromAtom >= 0 && toAtom >= 0 && fromAtom !== toAtom) {
          bonds.push({ from: fromAtom, to: toAtom, order: ringInfo.bondOrder || 1 })
          atoms[fromAtom].neighbors.push(toAtom)
          atoms[toAtom].neighbors.push(fromAtom)
        }
        ringMap.delete(ringNum)
        bondOrder = 1
      }
    }
    // Handle double bonds '='
    else if (char === '=') {
      bondOrder = 2
    }
    // Handle triple bonds '#'
    else if (char === '#') {
      bondOrder = 3
    }
    // Handle stereochemistry '@'
    else if (char === '@') {
      // Skip stereochemistry markers
    }
    // Handle charges and other modifiers
    else if (char === '+' || char === '-') {
      // Skip charges for now
    }
    
    i++
  }
  
  // Generate 3D coordinates using improved force-directed layout
  generate3DCoordinates(atoms, bonds)
  
  return { atoms, bonds }
}

// Improved force-directed layout for accurate 3D coordinates
function generate3DCoordinates(atoms: ParsedAtom[], bonds: ParsedBond[]) {
  const numAtoms = atoms.length
  if (numAtoms === 0) return
  
  // Initialize positions in a more structured way
  atoms.forEach((atom, i) => {
    // For peptides, use a helical initial arrangement
    const angle = (i / Math.max(numAtoms, 1)) * Math.PI * 6
    const radius = 1.5 + (i % 10) * 0.2
    const height = (i * 0.6) - (numAtoms * 0.3)
    atom.position = [
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    ]
  })
  
  // Force-directed layout with more iterations for better structure
  for (let iter = 0; iter < 100; iter++) {
    const forces: Array<[number, number, number]> = atoms.map(() => [0, 0, 0])
    
    // Bond forces (attraction) - target bond lengths based on bond order
    bonds.forEach(bond => {
      const a1 = atoms[bond.from]
      const a2 = atoms[bond.to]
      const dx = a2.position[0] - a1.position[0]
      const dy = a2.position[1] - a1.position[1]
      const dz = a2.position[2] - a1.position[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1
      
      // Target bond length based on bond order and elements
      let targetDist = 1.5
      if (bond.order === 2) targetDist = 1.3
      if (bond.order === 3) targetDist = 1.2
      
      const force = (dist - targetDist) * 0.15
      
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      const fz = (dz / dist) * force
      
      forces[bond.from][0] += fx
      forces[bond.from][1] += fy
      forces[bond.from][2] += fz
      forces[bond.to][0] -= fx
      forces[bond.to][1] -= fy
      forces[bond.to][2] -= fz
    })
    
    // Repulsion forces between all atoms (stronger for non-bonded)
    for (let i = 0; i < numAtoms; i++) {
      for (let j = i + 1; j < numAtoms; j++) {
        // Skip if bonded
        if (atoms[i].neighbors.includes(j)) continue
        
        const a1 = atoms[i]
        const a2 = atoms[j]
        const dx = a2.position[0] - a1.position[0]
        const dy = a2.position[1] - a1.position[1]
        const dz = a2.position[2] - a1.position[2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1
        const repulsion = 1.0 / (dist * dist + 0.1)
        
        const fx = (dx / dist) * repulsion * 0.05
        const fy = (dy / dist) * repulsion * 0.05
        const fz = (dz / dist) * repulsion * 0.05
        
        forces[i][0] -= fx
        forces[i][1] -= fy
        forces[i][2] -= fz
        forces[j][0] += fx
        forces[j][1] += fy
        forces[j][2] += fz
      }
    }
    
    // Apply forces with damping
    atoms.forEach((atom, i) => {
      atom.position[0] += forces[i][0] * 0.15
      atom.position[1] += forces[i][1] * 0.15
      atom.position[2] += forces[i][2] * 0.15
    })
  }
}

// Atom representation with proper element colors and TRON styling
function Atom({ position, element, color }: { position: [number, number, number], element: string, color: string }) {
  const getRadius = (elem: string) => {
    const radii: { [key: string]: number } = {
      'H': 0.25, 'C': 0.45, 'N': 0.42, 'O': 0.38,
      'S': 0.45, 'P': 0.45, 'F': 0.35, 'Cl': 0.42, 'Br': 0.45, 'I': 0.48
    }
    return radii[elem] || 0.4
  }
  
  const getElementColor = (elem: string) => {
    const colors: { [key: string]: string } = {
      'H': '#ffffff', 'C': '#00ffff', 'N': '#00f0ff', 'O': '#ff00ff',
      'S': '#ffff00', 'P': '#ff8800', 'F': '#00ff00', 'Cl': '#00ff00', 
      'Br': '#ff4444', 'I': '#aa00ff'
    }
    return colors[elem] || color
  }
  
  const radius = getRadius(element)
  const atomColor = getElementColor(element)
  
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={atomColor}
          emissive={atomColor}
          emissiveIntensity={0.5}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>
      {/* Outer glow ring */}
      <mesh>
        <sphereGeometry args={[radius * 1.15, 24, 24]} />
        <meshStandardMaterial
          color={atomColor}
          emissive={atomColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  )
}

// Bond representation with TRON styling
function Bond({ start, end, color, order = 1 }: { start: [number, number, number], end: [number, number, number], color: string, order?: number }) {
  const midPoint = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ] as [number, number, number]
  
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) +
    Math.pow(end[1] - start[1], 2) +
    Math.pow(end[2] - start[2], 2)
  )

  const direction = new THREE.Vector3(
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2]
  ).normalize()

  const radius = order === 2 ? 0.12 : order === 3 ? 0.15 : 0.1

  return (
    <mesh position={midPoint} rotation={new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
      )
    )}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        metalness={0.8}
        roughness={0.2}
      />
      {/* Glow effect for bonds */}
      <mesh>
        <cylinderGeometry args={[radius * 1.2, radius * 1.2, length, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          transparent
          opacity={0.3}
        />
      </mesh>
    </mesh>
  )
}

// SMILES-based structure renderer with detailed ball-and-stick model
function SMILESStructure({ smiles }: { smiles: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const [parsed, setParsed] = useState<{ atoms: ParsedAtom[], bonds: ParsedBond[] } | null>(null)

  useEffect(() => {
    if (smiles) {
      try {
        const result = parseSMILES(smiles)
        setParsed(result)
      } catch (error) {
        console.error('Error parsing SMILES:', error)
      }
    }
  }, [smiles])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08
    }
  })

  if (!parsed || parsed.atoms.length === 0) {
    return (
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00a0a0"
          emissiveIntensity={0.3}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
    )
  }

  // Center the molecule
  const center = parsed.atoms.reduce((acc, atom) => {
    return [
      acc[0] + atom.position[0],
      acc[1] + atom.position[1],
      acc[2] + atom.position[2]
    ]
  }, [0, 0, 0] as [number, number, number]).map(v => v / parsed.atoms.length) as [number, number, number]

  return (
    <group ref={groupRef} position={[-center[0], -center[1], -center[2]]}>
      {/* Render bonds first (so atoms appear on top) */}
      {parsed.bonds.map((bond, i) => (
        <Bond
          key={`bond-${i}`}
          start={parsed.atoms[bond.from].position}
          end={parsed.atoms[bond.to].position}
          color="#00ffff"
          order={bond.order}
        />
      ))}
      {/* Render atoms with proper element colors */}
      {parsed.atoms.map((atom, i) => (
        <Atom
          key={`atom-${i}`}
          position={atom.position}
          element={atom.element}
          color="#00ffff"
        />
      ))}
    </group>
  )
}

export default function MolecularStructure({ moleculeName, smiles, pdbData }: MolecularStructureProps) {
  const [moleculeSize, setMoleculeSize] = useState(10)

  useEffect(() => {
    if (smiles) {
      try {
        const parsed = parseSMILES(smiles)
        if (parsed.atoms.length > 0) {
          const positions = parsed.atoms.map(a => a.position)
          const minX = Math.min(...positions.map(p => p[0]))
          const maxX = Math.max(...positions.map(p => p[0]))
          const minY = Math.min(...positions.map(p => p[1]))
          const maxY = Math.max(...positions.map(p => p[1]))
          const minZ = Math.min(...positions.map(p => p[2]))
          const maxZ = Math.max(...positions.map(p => p[2]))
          const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ)
          setMoleculeSize(Math.max(size * 1.8, 10))
        }
      } catch (error) {
        console.error('Error calculating molecule size:', error)
      }
    }
  }, [smiles])

  return (
    <div className={styles.molecularContainer}>
      <div className={styles.molecularHeader}>
        <h3 className={styles.moleculeName}>{moleculeName}</h3>
        {smiles && (
          <div className={styles.smilesData}>
            <span className={styles.smilesLabel}>SMILES:</span>
            <code className={styles.smilesCode}>{smiles.substring(0, 80)}{smiles.length > 80 ? '...' : ''}</code>
          </div>
        )}
      </div>
      <div className={styles.viewerContainer}>
        <Canvas
          camera={{ position: [0, 0, moleculeSize], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.7} color="#00f0ff" />
          <pointLight position={[0, 10, -10]} intensity={1.0} color="#00ffff" />
          <directionalLight position={[0, 10, 0]} intensity={0.8} />
          
          {smiles ? (
            <SMILESStructure smiles={smiles} />
          ) : (
            <mesh>
              <sphereGeometry args={[2, 32, 32]} />
              <meshStandardMaterial
                color="#00f0ff"
                emissive="#00a0a0"
                emissiveIntensity={0.3}
                transparent
                opacity={0.3}
                wireframe
              />
            </mesh>
          )}
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={moleculeSize * 0.6}
            maxDistance={moleculeSize * 4}
          />
        </Canvas>
      </div>
      <div className={styles.molecularInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Type:</span>
          <span className={styles.infoValue}>Peptide Hormone</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Length:</span>
          <span className={styles.infoValue}>30-31 amino acids</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Function:</span>
          <span className={styles.infoValue}>Glucose metabolism, Insulin secretion</span>
        </div>
      </div>
    </div>
  )
}
