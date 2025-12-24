import { useEffect, useCallback, useState } from 'react'
import './ViewModal.css'

/**
 * ViewModal - Modal for viewing media content
 * Features: Video player, Image gallery with navigation, source link
 */

// Helper to extract driveFileId from driveViewLink URL
function extractDriveFileId(driveUrl) {
    if (!driveUrl) return null;
    // Format: https://drive.google.com/file/d/{fileId}/view or /preview
    const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

export default function ViewModal({ media, onClose }) {
    // Get driveFileId - fallback to extracting from driveViewLink if missing
    const driveFileId = media.driveFileId || extractDriveFileId(media.driveViewLink);

    // Video detection: show player if we have driveFileId AND mediaType is video
    const hasDriveContent = !!driveFileId;
    const driveEmbedUrl = driveFileId
        ? `https://drive.google.com/file/d/${driveFileId}/preview`
        : null;
    const sourceUrl = media.url || null;
    const platformLabel = media.platform ? media.platform.toUpperCase() : 'MEDIA';
    const isSynced = !!driveFileId || !!media.driveViewLink;

    // Image gallery state
    // Image gallery state
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // AI Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(media.visualAnalysis || null);
    const [analysisError, setAnalysisError] = useState(null);

    // Helper: Infer if content is video from title/URL when mediaType is not set
    const inferVideoType = () => {
        // Check explicit mediaType first
        if (media.mediaType === 'video') return true;
        if (media.mediaType === 'image') return false;

        // Fallback: Check title pattern (Instagram uses "Video by username")
        if (media.title?.toLowerCase().startsWith('video by')) return true;

        // Fallback: Check URL patterns
        const url = media.url || '';
        if (url.includes('/reel/') || url.includes('/reels/')) return true;
        if (url.includes('/shorts/')) return true;

        return false;
    };

    const isVideoContent = inferVideoType();

    // Helper to get actual viewable Drive URL (not thumbnail)
    const getActualDriveUrl = (item) => {
        const fileId = item.driveFileId || extractDriveFileId(item.driveViewLink);
        if (fileId) {
            // For videos, use embed iframe
            if (item.mediaType === 'video') {
                return `https://drive.google.com/file/d/${fileId}/preview`;
            }
            // For images, use large thumbnail (uc?export=view has CORS issues)
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
        }
        // Fallback to any available URL
        return item.thumbnailUrl || item.url || null;
    };

    // Build gallery from mediaItems with actual Drive content URLs
    const galleryImages = (() => {
        // Debug log
        console.log('🖼️ ViewModal media:', {
            hasMediaItems: !!media.mediaItems,
            mediaItemsCount: media.mediaItems?.length,
            driveFileId,
            thumbnailUrl: media.thumbnailUrl
        });

        if (media.mediaItems && Array.isArray(media.mediaItems) && media.mediaItems.length > 0) {
            return media.mediaItems.map((item, idx) => {
                const fileId = item.driveFileId || extractDriveFileId(item.driveViewLink);
                const itemIsVideo = item.mediaType === 'video';
                const url = getActualDriveUrl(item);

                console.log(`  Item ${idx + 1}:`, { fileId, url: url?.substring(0, 50), type: item.mediaType });

                return {
                    url: url,
                    driveId: fileId,
                    type: item.mediaType || 'image',
                    isVideo: itemIsVideo,
                    notSynced: !fileId
                };
            });
        }
        // Single item fallback - use inferred video type
        if (driveFileId) {
            return [{
                url: isVideoContent
                    ? `https://drive.google.com/file/d/${driveFileId}/preview`
                    : `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1920`,
                driveId: driveFileId,
                type: isVideoContent ? 'video' : 'image',
                isVideo: isVideoContent
            }];
        }
        // Thumbnail fallback if no Drive content - still use inferred type for label
        const thumbUrl = media.thumbnailUrl;
        return thumbUrl ? [{ url: thumbUrl, driveId: null, type: isVideoContent ? 'video' : 'image', isVideo: isVideoContent, notSynced: true }] : [];
    })();

    const hasGallery = galleryImages.length > 1
    const currentImage = galleryImages[currentImageIndex]
    // Use current item type for label (supports mixed video/image carousels)
    const isCurrentVideo = currentImage?.isVideo || false
    const typeLabel = isCurrentVideo
        ? (hasGallery ? `VIDEO ${currentImageIndex + 1}/${galleryImages.length}` : 'VIDEO')
        : (hasGallery ? `IMAGE ${currentImageIndex + 1}/${galleryImages.length}` : 'IMAGE')

    // Navigation handlers
    const goToPrevious = useCallback(() => {
        setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : galleryImages.length - 1))
    }, [galleryImages.length])

    const goToNext = useCallback(() => {
        setCurrentImageIndex(prev => (prev < galleryImages.length - 1 ? prev + 1 : 0))
    }, [galleryImages.length])

    // Close on Escape, navigate with arrows
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose()
        if (hasGallery && e.key === 'ArrowLeft') goToPrevious()
        if (hasGallery && e.key === 'ArrowRight') goToNext()
    }, [onClose, hasGallery, goToPrevious, goToNext])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [handleKeyDown])

    const handleAnalyzeVideo = async () => {
        if (!media.id || isAnalyzing) return;

        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            const geminiKey = localStorage.getItem('mindstore_gemini_key');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const userId = localStorage.getItem('mindstore_user_id');

            const response = await fetch(`${baseUrl}/api/analyze/video-visual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-gemini-api-key': geminiKey || ''
                },
                body: JSON.stringify({
                    userId: userId,
                    contentId: media.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze video');
            }

            setAnalysisResult(data.analysis);
        } catch (error) {
            console.error('Video Analysis Error:', error);
            setAnalysisError(error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('view-modal-overlay')) onClose()
    }

    return (
        <div className="view-modal-overlay" onClick={handleOverlayClick}>
            <div className="view-modal">
                {/* Close button */}
                <button className="view-modal-close" onClick={onClose}>
                    <span className="material-icons-round">close</span>
                </button>

                {/* Media container */}
                <div className="view-modal-media">
                    {currentImage ? (
                        currentImage.isVideo && currentImage.driveId ? (
                            // Video: Use native video element with streaming API
                            <video
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/drive/stream/${currentImage.driveId}`}
                                className="view-modal-video"
                                controls
                                autoPlay
                                playsInline
                                preload="auto"
                                title={media.title || 'Video'}
                                key={currentImageIndex}
                            />
                        ) : currentImage.isVideo && !currentImage.driveId ? (
                            // Video not synced yet - show thumbnail with message
                            <div className="view-modal-pending">
                                <img
                                    src={media.thumbnailUrl || currentImage.url}
                                    alt={media.title || 'Video thumbnail'}
                                    className="view-modal-image pending"
                                />
                                <div className="pending-overlay">
                                    <span className="material-icons-round">sync</span>
                                    <p>Video syncing to Drive...</p>
                                </div>
                            </div>
                        ) : currentImage.url ? (
                            // Image with URL: Show directly
                            <img
                                src={currentImage.url}
                                alt={media.title || 'Image'}
                                className="view-modal-image"
                                key={currentImageIndex}
                            />
                        ) : (
                            // Image without URL (not synced yet)
                            <div className="view-modal-pending">
                                {media.thumbnailUrl ? (
                                    <img
                                        src={media.thumbnailUrl}
                                        alt={media.title || 'Carousel thumbnail'}
                                        className="view-modal-image pending"
                                    />
                                ) : (
                                    <div className="view-modal-placeholder">
                                        <span className="material-icons-round">photo_library</span>
                                    </div>
                                )}
                                <div className="pending-overlay">
                                    <span className="material-icons-round">sync</span>
                                    <p>Image {currentImageIndex + 1} syncing...</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="view-modal-placeholder">
                            <span className="material-icons-round">image</span>
                            <p>No preview available</p>
                        </div>
                    )}

                    {/* Gallery navigation */}
                    {hasGallery && (
                        <>
                            <button
                                className="gallery-nav gallery-prev"
                                onClick={goToPrevious}
                                title="Previous (←)"
                            >
                                <span className="material-icons-round">chevron_left</span>
                            </button>
                            <button
                                className="gallery-nav gallery-next"
                                onClick={goToNext}
                                title="Next (→)"
                            >
                                <span className="material-icons-round">chevron_right</span>
                            </button>

                            {/* Dot indicators */}
                            <div className="gallery-dots">
                                {galleryImages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        className={`gallery-dot ${idx === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentImageIndex(idx)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Info panel */}
                <div className="view-modal-info">
                    <div className="view-modal-meta">
                        <span className="meta-chip">{platformLabel}</span>
                        <span className="meta-chip">{typeLabel}</span>
                        {isSynced && <span className="meta-chip success">SYNCED</span>}
                    </div>

                    <h2 className="view-modal-title">
                        {media.title || media.author || 'Untitled'}
                    </h2>
                    {media.author && media.title && (
                        <p className="view-modal-author">by {media.author}</p>
                    )}
                    {media.caption && (
                        <p className="view-modal-caption">{media.caption}</p>
                    )}

                    {/* AI Video Analysis Section */}
                    {isVideoContent && (
                        <div className="view-modal-ai-section">
                            <div className="ai-section-header">
                                <span className="material-icons-round ai-spark-icon">auto_awesome</span>
                                <h3>AI Video Understanding</h3>
                                {!analysisResult && !isAnalyzing && (
                                    <button
                                        className="ai-analyze-btn"
                                        onClick={handleAnalyzeVideo}
                                        disabled={isAnalyzing}
                                    >
                                        Analyze Video
                                    </button>
                                )}
                            </div>

                            {isAnalyzing && (
                                <div className="ai-loading">
                                    <div className="ai-spinner"></div>
                                    <p>AI is watching and analyzing the video...</p>
                                    <span className="ai-loading-subtext">This may take up to 60 seconds</span>
                                </div>
                            )}

                            {analysisError && (
                                <div className="ai-error">
                                    <span className="material-icons-round">error_outline</span>
                                    <p>{analysisError}</p>
                                    <button onClick={handleAnalyzeVideo} className="retry-btn">Retry</button>
                                </div>
                            )}

                            {analysisResult && (
                                <div className="ai-analysis-content">
                                    <div className="analysis-text">
                                        {analysisResult.split('\n').map((line, i) => (
                                            <p key={i}>{line}</p>
                                        ))}
                                    </div>
                                    <button
                                        className="ai-reanalyze-btn"
                                        onClick={handleAnalyzeVideo}
                                        disabled={isAnalyzing}
                                    >
                                        <span className="material-icons-round">refresh</span>
                                        Re-analyze
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Original URL - show as text */}
                    {sourceUrl && (
                        <p className="view-modal-url font-mono">
                            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                                {sourceUrl.length > 60 ? sourceUrl.substring(0, 60) + '...' : sourceUrl}
                            </a>
                        </p>
                    )}

                    {/* Action buttons */}
                    <div className="view-modal-actions">
                        {sourceUrl && (
                            <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-modal-btn source"
                            >
                                <span className="material-icons-round">open_in_new</span>
                                View Source
                            </a>
                        )}
                        {media.driveViewLink && (
                            <a
                                href={media.driveViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-modal-btn drive"
                            >
                                <span className="material-icons-round">cloud</span>
                                Open in Drive
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div >
    )
}
