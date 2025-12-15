import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Header from '../components/Header'
import './Settings.css'

function Settings() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme, isDark } = useTheme()
    const [apiKey, setApiKey] = useState('')
    const [usePersonalKey, setUsePersonalKey] = useState(false)

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
                {/* API Configuration */}
                <section className="settings-section">
                    <h2 className="section-label font-mono">API CONFIGURATION</h2>
                    <div className="settings-card">
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>Use Personal API Key</h3>
                                <p>Enable to use your own quota limits</p>
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
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
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
                    <h2 className="section-label font-mono">PREFERENCES</h2>
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

                        <div className="setting-item">
                            <div className="setting-icon green">
                                <span className="material-icons-round">auto_awesome</span>
                            </div>
                            <div className="setting-info">
                                <h3>Auto-Categorize</h3>
                                <p>AI suggests tags for new content</p>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item clickable">
                            <div className="setting-icon red">
                                <span className="material-icons-round">notifications</span>
                            </div>
                            <div className="setting-info">
                                <h3>Notifications</h3>
                            </div>
                            <span className="material-icons-round chevron">chevron_right</span>
                        </div>
                    </div>
                </section>

                {/* Account */}
                {user && (
                    <section className="settings-section">
                        <h2 className="section-label font-mono">ACCOUNT</h2>
                        <div className="settings-card">
                            <div className="setting-item">
                                <div className="setting-icon blue">
                                    <span className="material-icons-round">person</span>
                                </div>
                                <div className="setting-info">
                                    <h3>{user.email}</h3>
                                    <p className="font-mono">{user.tier?.toUpperCase() || 'FREE'} TIER</p>
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

                {/* Data Management */}
                <section className="settings-section">
                    <h2 className="section-label font-mono">DATA MANAGEMENT</h2>
                    <div className="settings-card">
                        <div className="setting-item clickable">
                            <div className="setting-icon orange">
                                <span className="material-icons-round">cloud_download</span>
                            </div>
                            <div className="setting-info">
                                <h3>Export Saved Data</h3>
                            </div>
                            <span className="material-icons-round chevron">chevron_right</span>
                        </div>

                        <div className="setting-item clickable danger">
                            <div className="setting-icon gray">
                                <span className="material-icons-round">delete_outline</span>
                            </div>
                            <div className="setting-info">
                                <h3>Clear Cache</h3>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <div className="settings-footer">
                    <p className="font-mono">MindStore v1.0.0</p>
                    <p>Made with ❤️ for Content Creators</p>
                </div>
            </main>
        </div>
    )
}

export default Settings
