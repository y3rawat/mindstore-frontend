import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './BottomNav.css'
import AddModal from './AddModal'

function BottomNav() {
    const [showAddModal, setShowAddModal] = useState(false)

    const navItems = [
        { path: '/', icon: 'home', label: 'HOME' },
        { path: '/library', icon: 'folder', label: 'LIBRARY' },
        { path: '/add', icon: 'add', label: 'ADD', isFab: true },
        { path: '/analyze', icon: 'chat', label: 'CHAT' },
        { path: '/settings', icon: 'settings', label: 'CONFIG' },
    ]

    return (
        <>
            <nav className="bottom-nav">
                <div className="bottom-nav-container">
                    {navItems.map((item) => (
                        item.isFab ? (
                            <button
                                key={item.path}
                                className="fab-button"
                                onClick={() => setShowAddModal(true)}
                            >
                                <div className="fab-circle">
                                    <span className="material-icons-round">{item.icon}</span>
                                </div>
                            </button>
                        ) : (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-button ${isActive ? 'active' : ''}`
                                }
                            >
                                <span className="material-icons-round">{item.icon}</span>
                                <span className="nav-label font-mono">{item.label}</span>
                            </NavLink>
                        )
                    ))}
                </div>
                <div className="bottom-nav-safe-area"></div>
            </nav>

            <AddModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />
        </>
    )
}

export default BottomNav
