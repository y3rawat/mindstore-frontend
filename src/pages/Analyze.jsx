import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { fetchUserContent } from '../api/urls'
import './Analyze.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Local storage key for Gemini API key
const GEMINI_KEY_STORAGE = 'mindstore_gemini_key'

function Chat() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            content: 'Ready to search your content. Ask about your saved videos, images, or notes.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showApiKeyModal, setShowApiKeyModal] = useState(false)
    const [geminiApiKey, setGeminiApiKey] = useState('')
    const messagesEndRef = useRef(null)

    // Load Gemini API key from localStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem(GEMINI_KEY_STORAGE)
        if (savedKey) {
            setGeminiApiKey(savedKey)
        }
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const saveApiKey = () => {
        if (geminiApiKey.trim()) {
            localStorage.setItem(GEMINI_KEY_STORAGE, geminiApiKey.trim())
            setShowApiKeyModal(false)
        }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim() || !user) return

        // Check for API key
        const storedKey = localStorage.getItem(GEMINI_KEY_STORAGE)
        if (!storedKey) {
            setShowApiKeyModal(true)
            return
        }

        // User Message
        const userMsg = {
            id: Date.now(),
            type: 'user',
            content: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, userMsg])
        const query = input
        setInput('')
        setIsLoading(true)

        try {
            // Call search API
            const response = await fetch(`${API_URL}/analyze/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-gemini-api-key': storedKey
                },
                body: JSON.stringify({
                    userId: user.id,
                    query: query
                })
            })

            const data = await response.json()

            if (data.success && data.results) {
                const aiMsg = {
                    id: Date.now() + 1,
                    type: 'ai',
                    content: data.results.length > 0
                        ? `Found ${data.results.length} result(s) matching "${query}"`
                        : `No content found for "${query}". Try a different search term.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    results: data.results
                }
                setMessages(prev => [...prev, aiMsg])
            } else {
                // Fallback: Search in user's content locally
                await searchLocalContent(query)
            }
        } catch (error) {
            console.error('Search error:', error)
            // Fallback to searching local content
            await searchLocalContent(query)
        } finally {
            setIsLoading(false)
        }
    }

    // Fallback: Search user's content by title/author
    const searchLocalContent = async (query) => {
        try {
            const contentData = await fetchUserContent(user.id, { limit: 100, offset: 0 })
            if (!contentData.success) throw new Error('Failed to fetch content')

            const queryLower = query.toLowerCase()
            const matchedItems = contentData.items.filter(item => {
                const title = item.media?.title?.toLowerCase() || ''
                const author = item.media?.author?.toLowerCase() || ''
                const platform = item.media?.platform?.toLowerCase() || ''
                return title.includes(queryLower) || author.includes(queryLower) || platform.includes(queryLower)
            }).slice(0, 5)

            const aiMsg = {
                id: Date.now() + 1,
                type: 'ai',
                content: matchedItems.length > 0
                    ? `Found ${matchedItems.length} item(s) matching "${query}" in your library:`
                    : `No content found for "${query}". Try searching by title, author, or platform.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                results: matchedItems.map(item => ({
                    id: item.contentHash,
                    title: item.media?.title || 'Untitled',
                    desc: item.media?.author ? `by ${item.media.author}` : item.media?.platform,
                    thumbnail: item.media?.thumbnailUrl,
                    platform: item.media?.platform,
                    tags: [item.media?.platform].filter(Boolean),
                    date: item.savedAt ? new Date(item.savedAt._seconds * 1000).toLocaleDateString() : ''
                }))
            }
            setMessages(prev => [...prev, aiMsg])
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                type: 'ai',
                content: `Sorry, I encountered an error: ${error.message}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
            setMessages(prev => [...prev, errorMsg])
        }
    }

    return (
        <div className="chat-page">
            {/* API Key Modal */}
            {showApiKeyModal && (
                <div className="api-key-modal-overlay">
                    <div className="api-key-modal">
                        <h2>🔑 Gemini API Key Required</h2>
                        <p>To use AI-powered search, please enter your Gemini API key.</p>
                        <p className="hint">Get one free at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a></p>
                        <input
                            type="password"
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="api-key-input"
                        />
                        <div className="modal-buttons">
                            <button className="btn-cancel" onClick={() => setShowApiKeyModal(false)}>Cancel</button>
                            <button className="btn-save" onClick={saveApiKey} disabled={!geminiApiKey.trim()}>Save Key</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="chat-shell">
                {/* Header */}
                <header className="chat-header">
                    <div className="header-brand">
                        <p className="eyebrow">Archivist</p>
                        <h1 className="header-title">
                            Content Search <span className="chat-badge">BETA</span>
                        </h1>
                        <p className="header-status">
                            <span className="status-indicator"></span>
                            NEURAL_LINK.{localStorage.getItem(GEMINI_KEY_STORAGE) ? 'READY' : 'NEEDS_KEY'}
                        </p>
                    </div>
                    <div className="header-actions">
                        <div className="header-pills">
                            <span className="pill">{user?.email || 'Guest'}</span>
                        </div>
                        <div className="header-buttons">
                            <button
                                className="icon-btn"
                                onClick={() => setShowApiKeyModal(true)}
                                title="Configure API Key"
                            >
                                <span className="material-icons-round">settings</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Chat Content */}
                <main className="chat-content">
                    <section className="messages-panel">
                        <div className="messages-list">
                            <div className="date-divider">
                                <span>TODAY {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {messages.map(msg => (
                                <div key={msg.id} className={`message-group ${msg.type}`}>
                                    {msg.type === 'user' ? (
                                        <>
                                            <div className="message-bubble user">
                                                <p>{msg.content}</p>
                                            </div>
                                            <div className="avatar-small">
                                                <span className="material-icons-round">person</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="avatar-ai">
                                                <span className="material-icons-round">smart_toy</span>
                                            </div>
                                            <div className="ai-container">
                                                <div className="message-bubble ai">
                                                    <p>{msg.content}</p>
                                                </div>

                                                {msg.results && msg.results.length > 0 && (
                                                    <div className="results-grid">
                                                        {msg.results.map(item => (
                                                            <div key={item.id} className="result-card">
                                                                <div className="result-media">
                                                                    {item.thumbnail ? (
                                                                        <img src={item.thumbnail} alt={item.title} />
                                                                    ) : (
                                                                        <div className="result-placeholder">
                                                                            <span className="material-icons-round">image</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="result-info">
                                                                    <div className="result-header">
                                                                        <h4>{item.title}</h4>
                                                                    </div>
                                                                    {item.desc && <p className="result-desc">{item.desc}</p>}
                                                                    <div className="result-tags">
                                                                        {item.tags?.map(tag => (
                                                                            <span key={tag}>#{tag}</span>
                                                                        ))}
                                                                        {item.date && <span className="date">{item.date}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <span className="timestamp">Archivist • {msg.timestamp}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="listening-indicator">
                                    <span className="material-icons-round animate-spin">sync</span>
                                    <p>Searching your content...</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </section>
                </main>

                {/* Input Area */}
                <div className="chat-input-area">
                    <div className="input-surface">
                        <div className="suggestions">
                            <button onClick={() => setInput('Show all YouTube videos')}>YouTube videos</button>
                            <button onClick={() => setInput('Find Instagram content')}>Instagram</button>
                            <button onClick={() => setInput('Recent saves')}>Recent</button>
                        </div>

                        <form onSubmit={handleSend} className="input-box">
                            <div className="glow-effect"></div>
                            <div className="input-wrapper">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Search your saved content..."
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend(e)
                                        }
                                    }}
                                />
                                <button type="submit" className="send-btn" disabled={isLoading}>
                                    <span className="material-icons-round">arrow_upward</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Chat
