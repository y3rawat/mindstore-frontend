import { memo, useState, useMemo } from 'react'
import './ContentCard.css'

// Proxy URL for images
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Check if URL is external (not our own domain)
 */
function isExternalUrl(url) {
    if (!url) return false
    try {
        const hostname = new URL(url).hostname
        if (hostname === 'localhost' || hostname === '127.0.0.1') return false
        if (url.startsWith('data:')) return false
        return true
    } catch {
        return false
    }
}

/**
 * Generate thumbnail URL from Google Drive file ID
 * Used as fallback when platform metadata fetch fails
 */
function getDriveThumbnailUrl(driveFileId) {
    if (!driveFileId) return null
    // Google Drive provides automatic thumbnails for video files
    // sz=w400 gives us a 400px wide thumbnail
    return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400`
}

/**
 * Get the display URL for a thumbnail
 * Falls back to Drive thumbnail if platform thumbnail is missing
 */
function getProxiedThumbnailUrl(url, driveFileId) {
    // First try the platform thumbnail URL
    if (url) {
        if (isExternalUrl(url)) {
            return `${API_URL}/image-proxy?url=${encodeURIComponent(url)}`
        }
        return url
    }
    // Fallback: Use Google Drive thumbnail if video is uploaded
    if (driveFileId) {
        return getDriveThumbnailUrl(driveFileId)
    }
    return null
}

/**
 * Get platform tag from platform name
 */
function getPlatformTag(platform) {
    const tags = {
        instagram: '#INSTA',
        youtube: '#YOUTUBE',
        twitter: '#TWITTER',
        linkedin: '#LINKEDIN',
        tiktok: '#TIKTOK',
    }
    return tags[platform] || '#MEDIA'
}

const ContentCard = memo(function ContentCard({ item, isSelected, onSelect, variant = 'grid' }) {
    const media = item.media || {}
    const status = media.downloadStatus

    const lacksMetadata = !media.thumbnailUrl && !media.driveFileId && !media.title && !media.author
    const pendingStatuses = new Set([
        'pending',
        'processing',
        'queued',
        'waiting',
        'created',
        'uploading',
        'drive-uploading',
        'drive_upload',
        'drive_pending',
        'init',
    ])

    // Treat undefined/failed-without-metadata as still loading metadata
    const isSoftPending = (!status || status === 'failed' || status === 'error') && lacksMetadata
    const isPending = pendingStatuses.has(status) || isSoftPending
    const isFailed = (status === 'failed' || status === 'error') && !isSoftPending
    const isCompleted = status === 'completed' || status === 'uploaded'
    const hasDrive = !!media.driveViewLink
    const [imageError, setImageError] = useState(false)

    const thumbnailUrl = useMemo(() =>
        getProxiedThumbnailUrl(media.thumbnailUrl, media.driveFileId),
        [media.thumbnailUrl, media.driveFileId]
    )

    const hasValidThumbnail = thumbnailUrl && !imageError
    // savedAt is from user_content (item level), not media_library (media level)
    const savedAt = item.savedAt?._seconds ? new Date(item.savedAt._seconds * 1000) : item.savedAt
    const formattedDate = savedAt ? new Date(savedAt).toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\//g, '-') : null

    // Generate platform-based fallback title
    const getPlatformFallbackTitle = () => {
        const platform = media.platform
        const type = media.mediaType === 'video' ? 'Video' : 'Post'
        const platformNames = {
            instagram: 'Instagram',
            youtube: 'YouTube',
            twitter: 'Twitter',
            tiktok: 'TikTok',
            linkedin: 'LinkedIn'
        }
        return `${platformNames[platform] || 'Media'} ${type}`
    }

    const displayTitle = isPending
        ? 'Processing...'
        : (media.title || media.author || getPlatformFallbackTitle())

    const displayMeta = isPending
        ? 'Fetching metadata...'
        : (formattedDate || 'No date')

    // Queue variant - horizontal card for processing items
    if (variant === 'queue') {
        return (
            <div className={`queue-card ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
                <div className="queue-thumbnail">
                    {hasValidThumbnail ? (
                        <img
                            src={thumbnailUrl}
                            alt=""
                            loading="lazy"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="thumbnail-placeholder">
                            <span className="material-icons-round">image</span>
                        </div>
                    )}
                    <div className="queue-overlay">
                        <span className="material-icons-round animate-spin">sync</span>
                    </div>
                </div>
                <div className="queue-content">
                    <h3 className="queue-title line-clamp-1">
                        {media.title || media.author || 'Processing...'}
                    </h3>
                    <p className="queue-status font-mono">
                        STATUS: {isPending ? 'Processing_' : 'Waiting_'}
                    </p>
                    <div className="queue-progress">
                        <div
                            className="queue-progress-bar"
                            style={{ width: isPending ? '75%' : '15%' }}
                        />
                    </div>
                </div>
                <button className="queue-menu" onClick={(e) => e.stopPropagation()}>
                    <span className="material-icons-round">more_vert</span>
                </button>
            </div>
        )
    }

    // Grid variant - default card for synced/downloaded items
    return (
        <div
            className={`content-card ${isSelected ? 'selected' : ''} ${isFailed ? 'failed' : ''}`}
            onClick={onSelect}
        >
            <div
                className="card-thumbnail"
                style={hasValidThumbnail ? { '--thumbnail-bg': `url(${thumbnailUrl})` } : {}}
            >
                {hasValidThumbnail ? (
                    <img
                        src={thumbnailUrl}
                        alt={media.title || ''}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="thumbnail-placeholder">
                        <span className="material-icons-round">
                            {media.mediaType === 'video' ? 'play_circle' : 'image'}
                        </span>
                    </div>
                )}

                {/* Platform Tag */}
                <span className={`card-tag platform-${media.platform}`}>
                    {getPlatformTag(media.platform)}
                </span>

                {/* Status Badge */}
                {isPending && (
                    <span className="card-status syncing">
                        <span className="material-icons-round animate-spin">sync</span>
                        PROCESSING
                    </span>
                )}
                {hasDrive && isCompleted && !isPending && (
                    <span className="card-status synced">
                        <span className="material-icons-round">cloud_done</span>
                        SYNCED
                    </span>
                )}

                {/* Play button for videos */}
                {media.mediaType === 'video' && isCompleted && (
                    <div className="card-play-overlay">
                        <span className="material-icons-round">play_circle</span>
                    </div>
                )}

                {/* Failed overlay */}
                {isFailed && (
                    <div className="card-failed-overlay">
                        <span className="material-icons-round">error</span>
                    </div>
                )}
            </div>

            <div className="card-body">
                <h3 className="card-title line-clamp-2">
                    {displayTitle}
                </h3>
                <p className="card-meta font-mono">
                    {displayMeta}
                </p>
            </div>
        </div>
    )
})

ContentCard.displayName = 'ContentCard'

export default ContentCard
