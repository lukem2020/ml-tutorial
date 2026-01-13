'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import styles from './SpinningCube.module.css'

function MiniCube({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3
      meshRef.current.rotation.y += delta * 0.3
    }
    if (edgesRef.current) {
      edgesRef.current.rotation.x = meshRef.current!.rotation.x
      edgesRef.current.rotation.y = meshRef.current!.rotation.y
    }
  })

  const size = 0.6
  const spacing = 0.65

  return (
    <group position={position.map(p => p * spacing) as [number, number, number]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00a0a0"
          emissiveIntensity={0.4}
          transparent
          opacity={0.15}
          wireframe={false}
        />
      </mesh>
      <lineSegments ref={edgesRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(size, size, size)]} />
        <lineBasicMaterial color="#00ffff" />
      </lineSegments>
    </group>
  )
}

function RubiksCube() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.2
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  // Create a 3x3x3 grid of cubes (27 total cubes)
  const cubes = []
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubes.push(
          <MiniCube key={`${x}-${y}-${z}`} position={[x, y, z]} />
        )
      }
    }
  }

  return <group ref={groupRef}>{cubes}</group>
}

export default function SpinningCube() {
  return (
    <div className={styles.cubeContainer}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#00f0ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#00ffff" />
        <pointLight position={[0, 10, 0]} intensity={0.8} color="#00a0a0" />
        <RubiksCube />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
      <div className={styles.cubeGlow}></div>
    </div>
  )
}

