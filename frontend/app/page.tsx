'use client'

import { useState } from 'react'
import ChatInterface from '@/components/ChatInterface'
import SpinningCube from '@/components/SpinningCube'
import styles from './page.module.css'

export default function Home() {
  const [chatStarted, setChatStarted] = useState(false)

  const handleChatStart = () => {
    setChatStarted(true)
  }

  return (
    <div className={styles.container}>
      <div className="tron-grid"></div>
      
      {!chatStarted ? (
        <>
          <header className={styles.header}>
            <div className={styles.logo}>
              <span className="glow">NEXUS-PHARMA</span>
            </div>
            <div className={styles.subtitle}>
              Computational Drug Redesign Platform
            </div>
          </header>

          <main className={styles.main}>
            <div className={styles.landing}>
              <SpinningCube />
              <div className={styles.landingContent}>
                <h1 className={`${styles.title} glow`}>
                  AI-Powered Drug Discovery
                </h1>
                <p className={styles.description}>
                  Transform drug molecules using advanced ML and literature insights.
                  Discover optimized compounds with enhanced MOA and reduced symptoms.
                </p>
                <button 
                  onClick={handleChatStart}
                  className={styles.startButton}
                >
                  Initialize NEXUS-PHARMA
                </button>
              </div>
            </div>
          </main>

          <footer className={styles.footer}>
            <div className={styles.footerContent}>
              <span>Powered by Transformer AI</span>
              <span className={styles.separator}>•</span>
              <span>SMILES Data Processing</span>
              <span className={styles.separator}>•</span>
              <span>Literature Synthesis</span>
            </div>
          </footer>
        </>
      ) : (
        <ChatInterface />
      )}
    </div>
  )
}

