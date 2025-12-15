import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Analyze.css'

function Chat() {
    const { user } = useAuth()
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            content: 'Ready to archive. Ask me about your saved content, tags, or summaries.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ])
    const [input, setInput] = useState('')
    const [isListening, setIsListening] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = (e) => {
        e.preventDefault()
        if (!input.trim()) return

        // User Message
        const userMsg = {
            id: Date.now(),
            type: 'user',
            content: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsListening(true)

        // Mock AI Response
        setTimeout(() => {
            const aiMsg = {
                id: Date.now() + 1,
                type: 'ai',
                content: `I found results for "${userMsg.content}"`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                results: [
                    {
                        id: 'v1',
                        title: 'Hiking Trails in Pacific NW',
                        desc: '...captured the amazing view while hiking up the ridge...',
                        thumbnail: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
                        duration: '04:12',
                        match: '98%',
                        tags: ['nature', 'travel'],
                        date: 'Oct 24'
                    },
                    {
                        id: 'v2',
                        title: "Puppy's First Hike",
                        desc: 'Took Max for some off-leash training in the mountains...',
                        thumbnail: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=300&fit=crop',
                        duration: '08:00',
                        match: '85%',
                        tags: ['dog', 'training'],
                        date: 'Oct 20'
                    }
                ]
            }
            setMessages(prev => [...prev, aiMsg])
            setIsListening(false)
        }, 1500)
    }

    return (
        <div className="chat-page">
            <div className="chat-shell">
                {/* Header */}
                <header className="chat-header">
                    <div className="header-brand">
                        <p className="eyebrow">Archivist</p>
                        <h1 className="header-title">
                            Conversational Console <span className="chat-badge">LIVE</span>
                        </h1>
                        <p className="header-status">
                            <span className="status-indicator"></span>
                            NEURAL_LINK.ESTABLISHED
                        </p>
                    </div>
                    <div className="header-actions">
                        <div className="header-pills">
                            <span className="pill">Library • Synced</span>
                            <span className="pill">{user?.email || 'Guest'}</span>
                        </div>
                        <div className="header-buttons">
                            <button className="icon-btn" aria-label="History">
                                <span className="material-icons-round">history</span>
                            </button>
                            <button className="icon-btn" aria-label="Profile">
                                <span className="material-icons-round">account_circle</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Chat Content */}
                <main className="chat-content">
                    <div className="status-row">
                        {/* Indexing Status */}
                        <div className="status-card">
                            <div className="status-info">
                                <div className="spinner-box">
                                    <span className="material-icons-round animate-spin">sync</span>
                                </div>
                                <div>
                                    <h3>Indexing new content</h3>
                                    <p>2 files remaining...</p>
                                </div>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill"></div>
                            </div>
                        </div>
                        <div className="status-meta">
                            <span className="pill muted">Auto-tagging on</span>
                            <span className="pill muted">Summaries cached</span>
                            <span className="pill muted">Context: Library</span>
                        </div>
                    </div>

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

                                                {msg.results && (
                                                    <div className="results-grid">
                                                        {msg.results.map(item => (
                                                            <div key={item.id} className="result-card">
                                                                <div className="result-media">
                                                                    <img src={item.thumbnail} alt={item.title} />
                                                                    <span className="duration">{item.duration}</span>
                                                                </div>
                                                                <div className="result-info">
                                                                    <div className="result-header">
                                                                        <h4>{item.title}</h4>
                                                                        <span className="match-score">{item.match} Match</span>
                                                                    </div>
                                                                    <p className="result-desc">{item.desc}</p>
                                                                    <div className="result-tags">
                                                                        {item.tags.map(tag => (
                                                                            <span key={tag}>#{tag}</span>
                                                                        ))}
                                                                        <span className="date">{item.date}</span>
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

                            {isListening && (
                                <div className="listening-indicator">
                                    <p>Archivist is listening...</p>
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
                            <button>Show clips with #nature</button>
                            <button>Unwatched this week</button>
                            <button>Only videos with captions</button>
                        </div>

                        <div className="input-box">
                            <div className="glow-effect"></div>
                            <div className="input-wrapper">
                                <button className="attach-btn" aria-label="Add attachments">
                                    <span className="material-icons-round">add_circle_outline</span>
                                </button>
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about videos, tags, or content..."
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend(e)
                                        }
                                    }}
                                />
                                <button className="send-btn" onClick={handleSend} aria-label="Send message">
                                    <span className="material-icons-round">arrow_upward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Chat
