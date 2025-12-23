import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { generateApiKey, getApiKey, revokeApiKey } from '../api/auth'
import Header from '../components/Header'
import './Settings.css'

function Settings() {
    const { user, logout } = useAuth()
    const { toggleTheme, isDark } = useTheme()
    const [geminiApiKey, setGeminiApiKey] = useState('')
    const [usePersonalKey, setUsePersonalKey] = useState(false)

    // External API key state
    const [externalApiKey, setExternalApiKey] = useState(null)
    const [apiKeyLoading, setApiKeyLoading] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)
    const [copySuccess, setCopySuccess] = useState(false)
    const [urlCopySuccess, setUrlCopySuccess] = useState(false)

    // Load existing API key on mount
    useEffect(() => {
        if (user?.id) {
            loadExternalApiKey()
        }
    }, [user?.id])

    const loadExternalApiKey = async () => {
        try {
            const result = await getApiKey(user.id)
            if (result.success && result.apiKey) {
                setExternalApiKey(result.apiKey)
            }
        } catch (error) {
            console.error('Failed to load API key:', error)
        }
    }

    const handleGenerateApiKey = async () => {
        if (!user?.id) return

        setApiKeyLoading(true)
        try {
            const result = await generateApiKey(user.id)
            if (result.success) {
                setExternalApiKey(result.apiKey)
                setShowApiKey(true)
            }
        } catch (error) {
            console.error('Failed to generate API key:', error)
            alert('Failed to generate API key')
        } finally {
            setApiKeyLoading(false)
        }
    }

    const handleRevokeApiKey = async () => {
        if (!user?.id) return

        if (!window.confirm('Are you sure you want to revoke this API key? Any integrations using it will stop working.')) {
            return
        }

        setApiKeyLoading(true)
        try {
            const result = await revokeApiKey(user.id)
            if (result.success) {
                setExternalApiKey(null)
                setShowApiKey(false)
            }
        } catch (error) {
            console.error('Failed to revoke API key:', error)
            alert('Failed to revoke API key')
        } finally {
            setApiKeyLoading(false)
        }
    }

    const copyApiKey = () => {
        if (externalApiKey) {
            navigator.clipboard.writeText(externalApiKey)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        }
    }

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const fullEndpointUrl = externalApiKey ? `${apiBaseUrl}/v1/${externalApiKey}/url` : ''

    const copyFullUrl = () => {
        if (fullEndpointUrl) {
            navigator.clipboard.writeText(fullEndpointUrl)
            setUrlCopySuccess(true)
            setTimeout(() => setUrlCopySuccess(false), 2000)
        }
    }

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to log out?')) {
            await logout()
        }
    }

    return (
        <div className="settings">
            <Header
                title="Settings"
                subtitle="_configuration"
                showSearch={false}
            />

            <main className="settings-content">
                {/* iOS Shortcuts Integration - Most Important! */}
                {externalApiKey && (
                    <section className="settings-section">
                        <h2 className="section-label font-mono">📱 iOS SHORTCUTS INTEGRATION</h2>
                        <div className="settings-card shortcuts-card">
                            <div className="shortcuts-intro">
                                <div className="setting-icon cyan large">
                                    <span className="material-icons-round">share</span>
                                </div>
                                <div className="shortcuts-text">
                                    <h3>Add to Share Sheet</h3>
                                    <p>Copy the URL below and use it in iOS Shortcuts to save content from any app!</p>
                                </div>
                            </div>

                            <div className="shortcut-url-section">
                                <label className="input-label font-mono">YOUR ENDPOINT URL</label>
                                <button
                                    className={`shortcut-url-btn ${urlCopySuccess ? 'copied' : ''}`}
                                    onClick={copyFullUrl}
                                >
                                    <code className="font-mono url-text">{fullEndpointUrl}</code>
                                    <span className="copy-indicator">
                                        <span className="material-icons-round">
                                            {urlCopySuccess ? 'check_circle' : 'content_copy'}
                                        </span>
                                        {urlCopySuccess ? 'Copied!' : 'Tap to Copy'}
                                    </span>
                                </button>
                            </div>

                            <div className="shortcuts-instructions">
                                <h4 className="font-mono">📋 STEP-BY-STEP SETUP</h4>
                                <ol>
                                    <li><strong>Open Shortcuts app</strong> on your iPhone/iPad</li>
                                    <li><strong>Tap +</strong> to create a new Shortcut</li>
                                    <li><strong>Add Action:</strong> Search for "Get URLs from Input" and add it</li>
                                    <li><strong>Add Action:</strong> Search for "Get Contents of URL" and add it</li>
                                    <li><strong>Configure "Get Contents of URL":</strong>
                                        <ul>
                                            <li>Tap "URL" and paste the endpoint URL above</li>
                                            <li>Tap "Show More"</li>
                                            <li>Change Method to <strong>POST</strong></li>
                                            <li>Add Header: <code>Content-Type</code> → <code>application/json</code></li>
                                            <li>Request Body: <strong>JSON</strong></li>
                                            <li>Add key: <code>url</code> → Select "URLs" from magic variables</li>
                                        </ul>
                                    </li>
                                    <li><strong>Optional:</strong> Add "Show Notification" action for confirmation</li>
                                    <li><strong>Tap the name</strong> at the top → Rename to "Save to MindStore"</li>
                                    <li><strong>Tap ⓘ icon</strong> → Enable "Show in Share Sheet"</li>
                                    <li><strong>Done!</strong> Now share any link → MindStore appears in actions</li>
                                </ol>
                            </div>
                        </div>
                    </section>
                )}

                {/* API Key Management */}
                <section className="settings-section">
                    <h2 className="section-label font-mono">🔑 API KEY</h2>
                    <div className="settings-card">
                        <div className="setting-item">
                            <div className="setting-icon cyan">
                                <span className="material-icons-round">vpn_key</span>
                            </div>
                            <div className="setting-info">
                                <h3>API Key</h3>
                                <p>{externalApiKey ? 'Your key for external integrations' : 'Generate a key to enable Shortcuts'}</p>
                            </div>
                        </div>

                        {externalApiKey ? (
                            <div className="api-key-display">
                                <div className="api-key-value">
                                    <code className="font-mono">
                                        {showApiKey ? externalApiKey : '••••••••••••••••••••••••••••••••••'}
                                    </code>
                                    <div className="api-key-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            title={showApiKey ? 'Hide' : 'Show'}
                                        >
                                            <span className="material-icons-round">
                                                {showApiKey ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={copyApiKey}
                                            title="Copy"
                                        >
                                            <span className="material-icons-round">
                                                {copySuccess ? 'check' : 'content_copy'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="api-key-buttons">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleGenerateApiKey}
                                        disabled={apiKeyLoading}
                                    >
                                        <span className="material-icons-round">refresh</span>
                                        Regenerate
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleRevokeApiKey}
                                        disabled={apiKeyLoading}
                                    >
                                        <span className="material-icons-round">delete</span>
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="api-key-generate">
                                <p className="text-muted">Generate an API key to enable iOS Shortcuts integration.</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleGenerateApiKey}
                                    disabled={apiKeyLoading}
                                >
                                    <span className="material-icons-round">add</span>
                                    {apiKeyLoading ? 'Generating...' : 'Generate API Key'}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Gemini API Configuration */}
                <section className="settings-section">
                    <h2 className="section-label font-mono">🤖 AI CONFIGURATION</h2>
                    <div className="settings-card">
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>Use Personal Gemini Key</h3>
                                <p>Enable to use your own API quota</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={usePersonalKey}
                                    onChange={(e) => setUsePersonalKey(e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        {usePersonalKey && (
                            <div className="setting-input-section">
                                <label className="input-label font-mono">GEMINI API KEY</label>
                                <div className="input-with-icon">
                                    <span className="material-icons-round">vpn_key</span>
                                    <input
                                        type="password"
                                        value={geminiApiKey}
                                        onChange={(e) => setGeminiApiKey(e.target.value)}
                                        placeholder="AIzaSyD..."
                                        className="input"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Preferences */}
                <section className="settings-section">
                    <h2 className="section-label font-mono">⚙️ PREFERENCES</h2>
                    <div className="settings-card">
                        <div className="setting-item clickable" onClick={toggleTheme}>
                            <div className="setting-icon purple">
                                <span className="material-icons-round">
                                    {isDark ? 'dark_mode' : 'light_mode'}
                                </span>
                            </div>
                            <div className="setting-info">
                                <h3>Appearance</h3>
                            </div>
                            <div className="setting-value">
                                <span>{isDark ? 'Dark' : 'Light'}</span>
                                <span className="material-icons-round">chevron_right</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Account */}
                {user && (
                    <section className="settings-section">
                        <h2 className="section-label font-mono">👤 ACCOUNT</h2>
                        <div className="settings-card">
                            <div className="setting-item">
                                <div className="setting-icon blue">
                                    <span className="material-icons-round">person</span>
                                </div>
                                <div className="setting-info">
                                    <h3>{user.email}</h3>
                                    <p className="font-mono">PERSONAL</p>
                                </div>
                            </div>

                            <div className="setting-item clickable" onClick={handleLogout}>
                                <div className="setting-icon gray">
                                    <span className="material-icons-round">logout</span>
                                </div>
                                <div className="setting-info">
                                    <h3 className="text-error">Log Out</h3>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Footer */}
                <div className="settings-footer">
                    <p className="font-mono">MindStore v1.0.0</p>
                    <p>Made with ❤️</p>
                </div>
            </main>
        </div>
    )
}

export default Settings
