'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import styles from './ChatInterface.module.css'
import 'highlight.js/styles/atom-one-dark.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        scrollToBottom()
      }, 100) // Scroll every 100ms during streaming
      return () => clearInterval(interval)
    }
  }, [isStreaming, scrollToBottom])

  useEffect(() => {
    // Welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: '**NEXUS-PHARMA** online. Systems initialized.\n\nTo begin, please describe your **research design**. This will help me understand:\n\n**Research Objectives**: What are you trying to discover or optimize?\n**Target Disease**: Which disease or condition are you investigating?\n**Drug Candidates**: Are there specific drugs or compounds you\'re analyzing?\n**Data Available**: Do you have SMILES data, literature sources, or other datasets?\n**Expected Outcomes**: What results are you hoping to achieve?\n\nPlease provide a detailed description of your research design to proceed.',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)

    // Create a placeholder assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }
    setMessages(prev => [...prev, assistantMessage])

    // Create abort controller for cancellation
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

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedContent += chunk

          // Update immediately for real-time character-by-character display
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: accumulatedContent, isStreaming: true }
              : msg
          ))

          // Auto-scroll as content streams in
          setTimeout(() => scrollToBottom(), 0)
        }

        // Final update to ensure all content is displayed
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: accumulatedContent, isStreaming: true }
            : msg
        ))
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ))
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled, remove the streaming message
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
        return
      }

      const errorMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '**Error**: Failed to connect to backend. Please ensure your FastAPI server is running.\n\n**Troubleshooting**:\n- Check if the backend server is running\n- Verify the API endpoint is correct\n- Check network connectivity',
        timestamp: new Date(),
        isStreaming: false
      }
      setMessages(prev => prev.map(msg => 
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
      // You could add a toast notification here
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

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.statusIndicator}></div>
          <span>NEXUS-PHARMA Active</span>
          {isStreaming && (
            <span className={styles.streamingBadge}>
              <span className={styles.streamingDot}></span>
              Streaming
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          <span>NEXUS-PHARMA v2.0</span>
        </div>
      </div>

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
              <div className={styles.messageHeader}>
                <div className={styles.headerLeftContent}>
                  <span className={styles.roleLabel}>
                    {message.role === 'user' ? 'You' : 'NEXUS-PHARMA'}
                  </span>
                  {message.isStreaming && (
                    <span className={styles.streamingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  )}
                </div>
                <div className={styles.headerRightContent}>
                  <span className={styles.timestamp}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.role === 'assistant' && message.content && (
                    <button
                      onClick={() => handleCopy(message.content)}
                      className={styles.copyButton}
                      title="Copy message"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M9 1H2C1.45 1 1 1.45 1 2V9H2V2H9V1ZM12 4H5C4.45 4 4 4.45 4 5V12C4 12.55 4.45 13 5 13H12C12.55 13 13 12.55 13 12V5C13 4.45 12.55 4 12 4ZM12 12H5V5H12V12Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.messageText}>
                {message.role === 'assistant' ? (
                  <div className={styles.markdownWrapper}>
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
                  </div>
                ) : (
                  <div className={styles.userMessageText}>{message.content}</div>
                )}
              </div>
            </div>
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

      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your research design: objectives, target disease, drug candidates, available data, and expected outcomes..."
            className={styles.input}
            rows={1}
            disabled={isLoading}
          />
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
          )}
        </div>
        <div className={styles.inputFooter}>
          <span className={styles.hint}>
            Press Enter to send, Shift+Enter for new line
          </span>
          {isStreaming && (
            <button onClick={handleStop} className={styles.stopTextButton}>
              Stop generating
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
