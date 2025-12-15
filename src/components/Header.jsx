import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import './Header.css'

function Header({ title = 'MindStore', subtitle = '_secure.digital.assets', showSearch = true, onSearch }) {
    const { user } = useAuth()
    const { theme, toggleTheme, isDark } = useTheme()
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e) => {
        setSearchQuery(e.target.value)
        if (onSearch) {
            onSearch(e.target.value)
        }
    }

    return (
        <header className="app-header">
            <div className="header-top">
                <div className="header-brand">
                    <h1 className="header-title">{title}</h1>
                    <p className="header-subtitle font-mono">{subtitle}</p>
                </div>
                <div className="header-actions">
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    >
                        <span className="material-icons-round">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                    <button className="header-avatar">
                        <span className="material-icons-round">account_circle</span>
                    </button>
                </div>
            </div>

            {showSearch && (
                <div className="search-container">
                    <span className="search-icon material-icons-round">search</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search archives, tags, or links..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <button className="filter-button">
                        <span className="material-icons-round">filter_list</span>
                    </button>
                </div>
            )}
        </header>
    )
}

export default Header
