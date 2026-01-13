'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import MolecularStructure from './MolecularStructure'
import styles from './ChatInterface.module.css'
import 'highlight.js/styles/atom-one-dark.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface ChatSession {
  id: string
  messages: Message[]
  createdAt: Date
  title?: string
}

export default function ChatInterface() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const initializedRef = useRef(false)

  // Get current session messages
  const currentSession = chatSessions.find(s => s.id === currentSessionId)
  const messages = currentSession?.messages || []

  // Helper function to update messages in current session
  const updateSessionMessages = (updater: (prev: Message[]) => Message[]) => {
    if (!currentSessionId) return
    setChatSessions(prev => prev.map(session => 
      session.id === currentSessionId
        ? { ...session, messages: updater(session.messages) }
        : session
    ))
  }

  // Initialize first session on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const initialSessionId = Date.now().toString()
      const initialSession: ChatSession = {
        id: initialSessionId,
        messages: [],
        createdAt: new Date()
      }
      setChatSessions([initialSession])
      setCurrentSessionId(initialSessionId)
    }
  }, [])

  // Handle new chat - save current and create new
  const handleNewChat = () => {
    // Current session is already saved (we update it in place)
    // Just create a new empty session
    const newSessionId = Date.now().toString()
    const newSession: ChatSession = {
      id: newSessionId,
      messages: [],
      createdAt: new Date()
    }
    setChatSessions(prev => [...prev, newSession])
    setCurrentSessionId(newSessionId)
    setInput('')
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-scroll during streaming (smooth, less frequent)
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        requestAnimationFrame(() => scrollToBottom())
      }, 200)
      return () => clearInterval(interval)
    }
  }, [isStreaming, scrollToBottom])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Ensure we have a current session (should always exist after mount)
    if (!currentSessionId) {
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    updateSessionMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)

    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }
    updateSessionMessages(prev => [...prev, assistantMessage])

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''
      let updateBuffer = ''
      let lastUpdateTime = Date.now()
      const UPDATE_INTERVAL = 16

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedContent += chunk
          updateBuffer += chunk

          const now = Date.now()
          if (now - lastUpdateTime >= UPDATE_INTERVAL || updateBuffer.length > 50) {
            requestAnimationFrame(() => {
              updateSessionMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: accumulatedContent, isStreaming: true }
                  : msg
              ))
              requestAnimationFrame(() => scrollToBottom())
            })
            updateBuffer = ''
            lastUpdateTime = now
          }
        }

        updateSessionMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: accumulatedContent, isStreaming: true }
            : msg
        ))
      }

      updateSessionMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ))
    } catch (error: any) {
      if (error.name === 'AbortError') {
        updateSessionMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
        return
      }

      const errorMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '**Error**: Failed to connect to backend. Please ensure your FastAPI server is running.\n\n**Troubleshooting**:\n- Check if the backend server is running\n- Verify the API endpoint is correct\n- Check network connectivity',
        timestamp: new Date(),
        isStreaming: false
      }
      updateSessionMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? errorMessage : msg
      ))
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Focus input when clicking on welcome screen or messages area
  const handleAreaClick = () => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus()
    }
  }

  const getGreeting = () => {
    return 'Welcome'
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    return `${displayHours}:${displayMinutes} ${ampm}`
  }

  const showWelcome = messages.length === 0

  // Example questions to show on welcome screen
  const exampleQuestions = [
    "Show me the molecular structure of GLP-1",
    "What is the molecular structure of insulin?",
    "Analyze SMILES data for molecular patterns",
    "Find drugs associated with diabetes",
    "Help me design a drug discovery research study"
  ]

  return (
    <div className={styles.chatLayout}>
      {/* Left Sidebar */}
      <div className={styles.sidebar}>
        <button 
          className={styles.sidebarButton} 
          title="New Chat"
          onClick={handleNewChat}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 5L10 1L18 5V11C18 15.418 14.418 19 10 19C5.582 19 2 15.418 2 11V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 10L9 13L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className={styles.sidebarButton} title="Delete">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6H17M8 6V4C8 3.44772 8.44772 3 9 3H11C11.5523 3 12 3.44772 12 4V6M5 6V16C5 17.1046 5.89543 18 7 18H13C14.1046 18 15 17.1046 15 16V6H5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className={styles.sidebarButton} title="Apps">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="2"/>
            <rect x="12" y="3" width="5" height="5" stroke="currentColor" strokeWidth="2"/>
            <rect x="3" y="12" width="5" height="5" stroke="currentColor" strokeWidth="2"/>
            <rect x="12" y="12" width="5" height="5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button className={styles.sidebarButton} title="Code">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 6L2 10L6 14M14 6L18 10L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Messages Area */}
        <div className={styles.messagesArea} onClick={handleAreaClick}>
          {showWelcome ? (
            <div className={styles.welcomeScreen}>
              <div className={styles.welcomeIcon}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2L4 8V16C4 22.627 9.373 28 16 28C22.627 28 28 22.627 28 16V8L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16L15 19L20 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className={styles.welcomeGreeting}>
                {getGreeting()}, USER!
              </h1>
              <p className={styles.welcomeSubtext}>
                How can I help you today?
              </p>
              <div className={styles.exampleQuestions}>
                <p className={styles.exampleLabel}>Try asking:</p>
                <div className={styles.questionChips}>
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      className={styles.questionChip}
                      onClick={() => {
                        setInput(question)
                        inputRef.current?.focus()
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.messagesContainer}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.message} ${styles[message.role]}`}
                >
                  <div 
                    className={styles.messageContent}
                    data-streaming={message.isStreaming ? 'true' : 'false'}
                  >
                    {message.role === 'assistant' ? (
                      <div className={styles.markdownWrapper}>
                        {(() => {
                          // Extract molecular structure tags from content
                          const molecularStructureRegex = /<molecular-structure([^>]*)\/>/g
                          const parts: Array<{ type: 'text' | 'molecule', content: string, attrs?: any }> = []
                          let lastIndex = 0
                          let match
                          
                          while ((match = molecularStructureRegex.exec(message.content)) !== null) {
                            // Add text before the tag
                            if (match.index > lastIndex) {
                              parts.push({
                                type: 'text',
                                content: message.content.substring(lastIndex, match.index)
                              })
                            }
                            
                            // Parse attributes
                            const attrs = match[1]
                            const nameMatch = attrs.match(/name="([^"]+)"/)
                            const smilesMatch = attrs.match(/smiles="([^"]+)"/)
                            
                            parts.push({
                              type: 'molecule',
                              content: '',
                              attrs: {
                                name: nameMatch ? nameMatch[1] : 'Unknown',
                                smiles: smilesMatch ? smilesMatch[1] : undefined
                              }
                            })
                            
                            lastIndex = match.index + match[0].length
                          }
                          
                          // Add remaining text
                          if (lastIndex < message.content.length) {
                            parts.push({
                              type: 'text',
                              content: message.content.substring(lastIndex)
                            })
                          }
                          
                          // If no molecular structures found, render normally
                          if (parts.length === 0 || parts.every(p => p.type === 'text')) {
                            return (
                              <>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                  components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                      const match = /language-(\w+)/.exec(className || '')
                                      return !inline && match ? (
                                        <div className={styles.codeBlockWrapper}>
                                          <div className={styles.codeBlockHeader}>
                                            <span>{match[1]}</span>
                                            <button
                                              onClick={() => handleCopy(String(children).replace(/\n$/, ''))}
                                              className={styles.copyCodeButton}
                                            >
                                              Copy
                                            </button>
                                          </div>
                                          <pre className={styles.codeBlock}>
                                            <code className={className} {...props}>
                                              {children}
                                            </code>
                                          </pre>
                                        </div>
                                      ) : (
                                        <code className={styles.inlineCode} {...props}>
                                          {children}
                                        </code>
                                      )
                                    },
                                    table({ children }: any) {
                                      return (
                                        <div className={styles.tableWrapper}>
                                          <table className={styles.markdownTable}>{children}</table>
                                        </div>
                                      )
                                    },
                                    a({ href, children }: any) {
                                      return (
                                        <a href={href} target="_blank" rel="noopener noreferrer" className={styles.markdownLink}>
                                          {children}
                                        </a>
                                      )
                                    }
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                                {message.isStreaming && (
                                  <span className={styles.typingCursor}>▊</span>
                                )}
                              </>
                            )
                          }
                          
                          // Render with molecular structures
                          return (
                            <>
                              {parts.map((part, index) => {
                                if (part.type === 'molecule' && part.attrs) {
                                  return (
                                    <MolecularStructure
                                      key={`molecule-${index}`}
                                      moleculeName={part.attrs.name}
                                      smiles={part.attrs.smiles}
                                    />
                                  )
                                } else {
                                  return (
                                    <ReactMarkdown
                                      key={`text-${index}`}
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                      components={{
                                        code({ node, inline, className, children, ...props }: any) {
                                          const match = /language-(\w+)/.exec(className || '')
                                          return !inline && match ? (
                                            <div className={styles.codeBlockWrapper}>
                                              <div className={styles.codeBlockHeader}>
                                                <span>{match[1]}</span>
                                                <button
                                                  onClick={() => handleCopy(String(children).replace(/\n$/, ''))}
                                                  className={styles.copyCodeButton}
                                                >
                                                  Copy
                                                </button>
                                              </div>
                                              <pre className={styles.codeBlock}>
                                                <code className={className} {...props}>
                                                  {children}
                                                </code>
                                              </pre>
                                            </div>
                                          ) : (
                                            <code className={styles.inlineCode} {...props}>
                                              {children}
                                            </code>
                                          )
                                        },
                                        table({ children }: any) {
                                          return (
                                            <div className={styles.tableWrapper}>
                                              <table className={styles.markdownTable}>{children}</table>
                                            </div>
                                          )
                                        },
                                        a({ href, children }: any) {
                                          return (
                                            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.markdownLink}>
                                              {children}
                                            </a>
                                          )
                                        }
                                      }}
                                    >
                                      {part.content}
                                    </ReactMarkdown>
                                  )
                                }
                              })}
                              {message.isStreaming && (
                                <span className={styles.typingCursor}>▊</span>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    ) : (
                      <div className={styles.userMessageText}>{message.content}</div>
                    )}
                  </div>
                  <div className={styles.messageTimestamp}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                  {message.role === 'assistant' && message.content && !message.isStreaming && (
                    <button
                      onClick={() => handleCopy(message.content)}
                      className={styles.messageCopyButton}
                      title="Copy message"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M9 1H2C1.45 1 1 1.45 1 2V9H2V2H9V1ZM12 4H5C4.45 4 4 4.45 4 5V12C4 12.55 4.45 13 5 13H12C12.55 13 13 12.55 13 12V5C13 4.45 12.55 4 12 4ZM12 12H5V5H12V12Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              {isLoading && !isStreaming && (
                <div className={`${styles.message} ${styles.assistant}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          {showWelcome && (
            <div className={styles.actionButtons}>
              <button className={styles.actionButton}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 6L9 2L15 6M9 2V16M3 6V12C3 13.6569 4.34315 15 6 15H12C13.6569 15 15 13.6569 15 12V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Code</span>
              </button>
              <button className={styles.actionButton}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9H15M9 3V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Write</span>
              </button>
              <button className={styles.actionButton}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L11 7H16L12 10L13.5 15L9 12L4.5 15L6 10L2 7H7L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Learn</span>
              </button>
              <button className={styles.actionButton}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2C11.2091 2 13 3.79086 13 6C13 8.20914 11.2091 10 9 10C6.79086 10 5 8.20914 5 6C5 3.79086 6.79086 2 9 2Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 16C3 13.7909 5.79086 12 9 12C12.2091 12 15 13.7909 15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Research</span>
              </button>
              <button className={styles.actionButton}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L11 7H16L12 10L13.5 15L9 12L4.5 15L6 10L2 7H7L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>NEXUS Choice</span>
              </button>
            </div>
          )}

          <div className={styles.inputWrapper}>
            <div className={styles.inputLeft}>
              <button className={styles.inputIconButton} title="New Chat">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3V15M3 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button className={styles.inputIconButton} title="History">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 5V9L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
            </div>
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="How can I help you today?"
              className={styles.input}
              rows={1}
              disabled={isLoading}
            />

            <div className={styles.inputRight}>
              {isStreaming ? (
                <button
                  onClick={handleStop}
                  className={styles.stopButton}
                  title="Stop generation"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="4" y="4" width="8" height="8" fill="currentColor" />
                  </svg>
                </button>
              ) : (
                <>
                  <div className={styles.statusIndicator}>
                    <div className={styles.statusDot}></div>
                  </div>
                  <select className={styles.modelSelector}>
                    <option>NEXUS v2.0</option>
                  </select>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className={styles.sendButton}
                    title="Send message"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
