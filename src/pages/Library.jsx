import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchUserContent, deleteMultipleUrls } from '../api/urls'
import Header from '../components/Header'
import ContentCard from '../components/ContentCard'
import './Library.css'

const ITEMS_PER_PAGE = 10 // Reduced from 20 for faster initial load

function Library() {
    const { user, loading: authLoading } = useAuth()
    const userId = user?.id

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [filter, setFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedItems, setSelectedItems] = useState([])
    const [isDeleting, setIsDeleting] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => {
        // Wait for auth to complete before fetching
        if (authLoading) return

        if (userId) {
            fetchContent(1, true)
        } else {
            setLoading(false)
            setItems([])
        }
    }, [userId, authLoading])

    const fetchContent = useCallback(async (pageNum = 1, reset = false) => {
        if (!userId) return

        if (reset) {
            setLoading(true)
        } else {
            setLoadingMore(true)
        }

        try {
            const data = await fetchUserContent(userId, {
                limit: ITEMS_PER_PAGE,
                offset: (pageNum - 1) * ITEMS_PER_PAGE
            })

            if (data.success) {
                const newItems = data.items || []
                console.log('📊 Library received items:', newItems.slice(0, 2).map(item => ({
                    title: item.media?.title,
                    author: item.media?.author,
                    caption: item.media?.caption,
                    thumbnailUrl: item.media?.thumbnailUrl,
                    platform: item.media?.platform
                })))
                setItems(prev => reset ? newItems : [...prev, ...newItems])
                setHasMore(newItems.length === ITEMS_PER_PAGE)
                setPage(pageNum)
            }
        } catch (error) {
            console.error('Failed to fetch content:', error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [userId])

    // Refresh library when new content is added elsewhere
    useEffect(() => {
        const handleContentUpdated = () => fetchContent(1, true)
        window.addEventListener('mindstore:content-updated', handleContentUpdated)
        return () => window.removeEventListener('mindstore:content-updated', handleContentUpdated)
    }, [fetchContent])

    // Auto-poll when there are pending/processing items
    useEffect(() => {
        // Check if any items are still processing
        const hasPendingItems = items.some(item => {
            const status = item.media?.downloadStatus
            return status === 'pending' || status === 'processing'
        })

        if (!hasPendingItems || !userId) return

        // Poll every 5 seconds when items are processing
        const pollInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing (items processing)...')
            fetchContent(1, true)
        }, 5000)

        return () => clearInterval(pollInterval)
    }, [items, userId, fetchContent])

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchContent(page + 1, false)
        }
    }

    const toggleSelect = (contentHash) => {
        setSelectedItems(prev =>
            prev.includes(contentHash)
                ? prev.filter(i => i !== contentHash)
                : [...prev, contentHash]
        )
    }

    const deleteSelected = async () => {
        if (!userId || selectedItems.length === 0) return

        const confirmed = window.confirm(
            `Delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?`
        )
        if (!confirmed) return

        setIsDeleting(true)
        try {
            await deleteMultipleUrls(selectedItems, userId)
            await fetchContent(1, true)
            setSelectedItems([])
        } catch (error) {
            console.error('Failed to delete items:', error.message)
            alert(`Failed to delete: ${error.message}`)
        } finally {
            setIsDeleting(false)
        }
    }

    // Filter and search
    let filteredItems = filter === 'all'
        ? items
        : items.filter(item => item.media?.platform === filter)

    if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredItems = filteredItems.filter(item =>
            item.media?.title?.toLowerCase().includes(query) ||
            item.media?.author?.toLowerCase().includes(query) ||
            item.media?.platform?.toLowerCase().includes(query)
        )
    }

    const platforms = ['all', 'instagram', 'youtube', 'twitter', 'linkedin', 'tiktok']

    return (
        <div className="library">
            <Header
                title="Library"
                subtitle="_your.archives"
                onSearch={setSearchQuery}
            />

            {/* Selection Actions */}
            {selectedItems.length > 0 && (
                <div className="selection-bar">
                    <span className="font-mono">{selectedItems.length} SELECTED</span>
                    <div className="selection-actions">
                        <button
                            className="btn btn-danger"
                            onClick={deleteSelected}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedItems([])}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="filter-tabs no-scrollbar">
                {platforms.map(p => (
                    <button
                        key={p}
                        className={`filter-tab ${filter === p ? 'active' : ''}`}
                        onClick={() => setFilter(p)}
                    >
                        <span className="filter-label font-mono">
                            {p === 'all' ? 'ALL' : `#${p.toUpperCase()}`}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <main className="library-content">
                {(authLoading || loading) ? (
                    <div className="loading-state">
                        <div className="loader-spinner"></div>
                        <p className="font-mono">Loading archives...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <span className="material-icons-round">folder_open</span>
                        <h3>No content found</h3>
                        <p className="font-mono">
                            {searchQuery ? 'Try a different search' : 'Save content from the home screen'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="content-grid">
                            {filteredItems.map(item => (
                                <ContentCard
                                    key={item.contentHash || item.id}
                                    item={item}
                                    isSelected={selectedItems.includes(item.contentHash)}
                                    onSelect={() => toggleSelect(item.contentHash)}
                                />
                            ))}
                        </div>

                        {hasMore && filter === 'all' && !searchQuery && (
                            <div className="load-more">
                                <button
                                    className="btn btn-secondary"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default Library
