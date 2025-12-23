import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchUserContent, saveUrl, deleteUrl } from '../api/urls'
import { fetchUserUsage } from '../api/auth'
import Header from '../components/Header'
import ContentCard from '../components/ContentCard'
import './Dashboard.css'

function Dashboard() {
    const { user, loading: authLoading, signIn, signUp, logout } = useAuth()

    const [url, setUrl] = useState('')
    const [saving, setSaving] = useState(false)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [result, setResult] = useState(null)

    // Auth form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [authError, setAuthError] = useState('')

    const loadContent = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const data = await fetchUserContent(user.id, { limit: 50, offset: 0 })
            console.log('📦 Dashboard loaded items:', data.items?.length, data.items?.slice(0, 2))
            if (data.success) {
                setItems(data.items || [])
            }
        } catch (error) {
            console.error('Failed to load content:', error)
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    // Load user content
    useEffect(() => {
        if (user?.id) {
            loadContent()
        } else {
            setLoading(false)
            setItems([])
        }
    }, [user?.id, loadContent])

    // Auto-refresh when there are processing items (poll every 3 seconds)
    useEffect(() => {
        const hasProcessingItems = items.some(item => {
            const media = item.media || {}
            return media.downloadStatus === 'pending' || media.downloadStatus === 'processing' || media.downloadStatus === 'queued'
        })

        if (hasProcessingItems && user?.id) {
            console.log('⏳ Processing items detected, starting auto-refresh...')
            const pollInterval = setInterval(() => {
                loadContent()
            }, 3000) // Poll every 3 seconds

            return () => {
                console.log('✅ Stopping auto-refresh (no more processing items)')
                clearInterval(pollInterval)
            }
        }
    }, [items, user?.id, loadContent])

    // Listen for global content updates (e.g., Add modal) and refresh
    useEffect(() => {
        const handleContentUpdated = () => {
            loadContent()
        }
        window.addEventListener('mindstore:content-updated', handleContentUpdated)
        return () => window.removeEventListener('mindstore:content-updated', handleContentUpdated)
    }, [loadContent])

    const handleAuth = async (e) => {
        e.preventDefault()
        setAuthError('')
        try {
            if (isSignUp) {
                await signUp(email, password)
            } else {
                await signIn(email, password)
            }
        } catch (error) {
            setAuthError(error.message)
        }
    }

    const handleSaveUrl = async (e) => {
        e.preventDefault()
        if (!url.trim() || !user) return

        setSaving(true)
        setResult(null)

        try {
            const data = await saveUrl(url, user.id)
            if (data.success) {
                setResult({ success: true, message: 'Content saved!' })
                setUrl('')
                window.dispatchEvent(new CustomEvent('mindstore:content-updated', { detail: { source: 'dashboard', url } }))
                loadContent()
                setTimeout(() => setShowAddModal(false), 1500)
            } else {
                setResult({ success: false, message: data.error || 'Failed to save' })
            }
        } catch (error) {
            setResult({ success: false, message: error.message })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteItem = async (contentHash) => {
        if (!user?.id) return
        try {
            await deleteUrl(contentHash, user.id)
            loadContent()
        } catch (error) {
            console.error('Failed to delete item:', error)
            alert(`Failed to delete: ${error.message}`)
        }
    }

    // Processing Queue: items still being processed (pending/processing/queued) or soft-failed without metadata
    const processingItems = useMemo(() => items.filter(item => {
        const media = item.media || {}
        const isSoftPending = media.downloadStatus === 'failed' && !media.thumbnailUrl && !media.driveFileId && !media.title
        return media.downloadStatus === 'pending' || media.downloadStatus === 'processing' || media.downloadStatus === 'queued' || isSoftPending
    }), [items])

    // Synced Files: items uploaded to Google Drive
    const syncedItems = useMemo(() => items.filter(item =>
        item.media?.driveViewLink || item.media?.driveFileId
    ), [items])

    // All Content: items that are NOT in processing queue
    // This includes synced items and any other completed/saved items
    const allContentItems = useMemo(() => items.filter(item => {
        const media = item.media || {}
        const isSoftPending = media.downloadStatus === 'failed' && !media.thumbnailUrl && !media.driveFileId && !media.title
        return media.downloadStatus !== 'pending' && media.downloadStatus !== 'processing' && media.downloadStatus !== 'queued' && !isSoftPending
    }), [items])

    // Debug log
    useEffect(() => {
        if (items.length > 0) {
            console.log('📊 Dashboard sections:', {
                total: items.length,
                processing: processingItems.length,
                synced: syncedItems.length,
                allContent: allContentItems.length
            })
        }
    }, [items])

    // Show loading
    if (authLoading) {
        return (
            <div className="dashboard">
                <div className="loading-container">
                    <div className="loader-spinner"></div>
                    <p className="font-mono">Loading...</p>
                </div>
            </div>
        )
    }

    // Show login
    if (!user) {
        return (
            <div className="dashboard">
                <div className="login-container">
                    <div className="login-card">
                        <h1 className="login-title">MindStore</h1>
                        <p className="login-subtitle font-mono">_secure.digital.assets</p>

                        <form onSubmit={handleAuth} className="login-form">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="input"
                                required
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="input"
                                required
                                minLength={6}
                            />

                            {authError && (
                                <div className="auth-error">{authError}</div>
                            )}

                            <button type="submit" className="btn btn-primary btn-full">
                                {isSignUp ? 'Create Account' : 'Sign In'}
                            </button>
                        </form>

                        <p className="login-toggle">
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <button onClick={() => setIsSignUp(!isSignUp)}>
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard">
            <Header
                title="MindStore"
                subtitle="_secure.digital.assets"
            />

            <main className="dashboard-content">
                {/* Processing Queue Section */}
                {processingItems.length > 0 && (
                    <section className="section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span className="status-dot status-dot-processing"></span>
                                Processing Queue
                            </h2>
                            <span className="section-count font-mono">{processingItems.length}</span>
                        </div>
                        <div className="queue-grid-3row">
                            {processingItems.slice(0, 6).map(item => (
                                <ContentCard
                                    key={item.contentHash || item.id}
                                    item={item}
                                    variant="grid"
                                    onDelete={handleDeleteItem}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Synced to Drive Section */}
                {syncedItems.length > 0 && (
                    <section className="section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span className="status-dot status-dot-synced"></span>
                                Synced Files
                            </h2>
                            <span className="section-link" onClick={() => window.location.href = '/library'}>View All &gt;</span>
                        </div>
                        <div className="content-scroll">
                            {syncedItems.map(item => (
                                <ContentCard
                                    key={item.contentHash || item.id}
                                    item={item}
                                    variant="grid"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* All Content Section - shows all non-processing items */}
                {allContentItems.length > 0 && (
                    <section className="section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span className="status-dot status-dot-local"></span>
                                All Content
                            </h2>
                            <span className="section-link" onClick={() => window.location.href = '/library'}>View All &gt;</span>
                        </div>
                        <div className="content-grid-2row">
                            {allContentItems.slice(0, 4).map(item => (
                                <ContentCard
                                    key={item.contentHash || item.id}
                                    item={item}
                                    variant="grid"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {items.length === 0 && !loading && (
                    <div className="empty-state">
                        <span className="material-icons-round">cloud_off</span>
                        <h3>No content yet</h3>
                        <p className="font-mono">Tap + to save your first link</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="loading-state">
                        <div className="loader-spinner"></div>
                        <p className="font-mono">Loading archives...</p>
                    </div>
                )}
            </main>

            {/* Add URL Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Content</h2>
                            <button onClick={() => setShowAddModal(false)}>
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSaveUrl} className="add-form">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste URL from Instagram, YouTube, Twitter..."
                                className="input"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="btn btn-primary btn-full"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Content'}
                            </button>
                            {result && (
                                <div className={`result-message ${result.success ? 'success' : 'error'}`}>
                                    {result.message}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
