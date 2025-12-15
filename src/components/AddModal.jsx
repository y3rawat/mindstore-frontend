import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { saveUrl } from '../api/urls'
import './AddModal.css'

function AddModal({ isOpen, onClose }) {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('link') // 'link' or 'upload'
    const [url, setUrl] = useState('')
    const [saving, setSaving] = useState(false)
    const [result, setResult] = useState(null)

    // Upload state
    const [selectedFile, setSelectedFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [uploadDetails, setUploadDetails] = useState({
        title: '',
        description: '',
        platform: 'other'
    })
    const fileInputRef = useRef(null)
    const urlInputRef = useRef(null)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab('link')
            setUrl('')
            setResult(null)
            setSelectedFile(null)
            setPreview(null)
            setUploadDetails({ title: '', description: '', platform: 'other' })

            // Auto focus link input
            setTimeout(() => {
                urlInputRef.current?.focus()
            }, 100)
        }
    }, [isOpen])

    const handleClose = () => {
        onClose()
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
                window.dispatchEvent(new CustomEvent('mindstore:content-updated', { detail: { source: 'add-modal', url } }))
                setTimeout(() => {
                    handleClose()
                }, 1000)
            } else {
                setResult({ success: false, message: data.error || 'Failed to save' })
            }
        } catch (error) {
            // Handle 409 Conflict (duplicate) as a special case
            if (error.status === 409) {
                setResult({ success: true, message: 'Already in your library!' })
                window.dispatchEvent(new CustomEvent('mindstore:content-updated', { detail: { source: 'add-modal-duplicate', url } }))
                setTimeout(() => {
                    handleClose()
                }, 1500)
            } else {
                setResult({ success: false, message: error.message || 'Failed to save' })
            }
        } finally {
            setSaving(false)
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setSelectedFile(file)

        // Create preview
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file)
            setPreview(url)
        }
    }

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!selectedFile || !user) return

        setSaving(true)
        setResult(null)

        try {
            // Placeholder upload logic
            setTimeout(() => {
                setResult({ success: false, message: 'Upload feature coming soon!' })
            }, 1000)
        } catch (error) {
            setResult({ success: false, message: error.message })
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="add-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>Add New Content</h2>
                    <button onClick={handleClose} className="close-btn">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'link' ? 'active' : ''}`}
                        onClick={() => setActiveTab('link')}
                    >
                        <span className="material-icons-round">link</span>
                        Paste Link
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <span className="material-icons-round">cloud_upload</span>
                        Upload File
                    </button>
                </div>

                {/* Link Mode */}
                {activeTab === 'link' && (
                    <form onSubmit={handleSaveUrl} className="link-form">
                        <div className="input-group">
                            <span className="input-icon material-icons-round">link</span>
                            <input
                                ref={urlInputRef}
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste URL (Instagram, YouTube, etc.)"
                                className="input-field"
                                autoFocus
                                required
                            />
                        </div>

                        <p className="hint">
                            <span className="material-icons-round">info</span>
                            Supports Instagram, YouTube, Twitter, LinkedIn, TikTok
                        </p>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={saving || !url.trim()}
                        >
                            {saving ? (
                                <>
                                    <span className="material-icons-round animate-spin">sync</span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons-round">save</span>
                                    Save to Library
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Upload Mode */}
                {activeTab === 'upload' && (
                    <form onSubmit={handleUpload} className="upload-form">
                        {/* File Drop Zone */}
                        {!selectedFile ? (
                            <div
                                className="drop-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="drop-icon">
                                    <span className="material-icons-round">add_photo_alternate</span>
                                </div>
                                <h3>Select Media to Upload</h3>
                                <p className="font-mono">JPG, PNG, MP4, MOV</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                    hidden
                                />
                            </div>
                        ) : (
                            <div className="file-preview">
                                {selectedFile.type.startsWith('video/') ? (
                                    <video src={preview} controls className="preview-media" />
                                ) : (
                                    <img src={preview} alt="Preview" className="preview-media" />
                                )}
                                <button
                                    type="button"
                                    className="remove-file"
                                    onClick={() => {
                                        setSelectedFile(null)
                                        setPreview(null)
                                    }}
                                >
                                    <span className="material-icons-round">close</span>
                                </button>
                            </div>
                        )}

                        {/* Details Form */}
                        {selectedFile && (
                            <div className="upload-details">
                                <input
                                    type="text"
                                    value={uploadDetails.title}
                                    onChange={(e) => setUploadDetails(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Title (optional)"
                                    className="input-field"
                                />
                                <div className="select-wrapper">
                                    <select
                                        value={uploadDetails.platform}
                                        onChange={(e) => setUploadDetails(prev => ({ ...prev, platform: e.target.value }))}
                                        className="input-field select"
                                    >
                                        <option value="other">Select Platform / Category</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="twitter">Twitter</option>
                                    </select>
                                    <span className="material-icons-round select-arrow">expand_more</span>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={saving || !selectedFile}
                        >
                            {saving ? (
                                <>
                                    <span className="material-icons-round animate-spin">sync</span>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons-round">cloud_upload</span>
                                    Upload to Cloud
                                </>
                            )}
                        </button>
                    </form>
                )}

                {result && (
                    <div className={`result-message ${result.success ? 'success' : 'error'}`}>
                        <span className="material-icons-round">
                            {result.success ? 'check_circle' : 'error'}
                        </span>
                        {result.message}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AddModal
