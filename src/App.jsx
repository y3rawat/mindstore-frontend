import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import './App.css'

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Library = lazy(() => import('./pages/Library'))
const Analyze = lazy(() => import('./pages/Analyze'))
const Settings = lazy(() => import('./pages/Settings'))

// Loading fallback component
const PageLoader = () => (
    <div className="page-loader">
        <div className="loader-spinner"></div>
        <p>Loading...</p>
    </div>
)

function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <AuthProvider>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Dashboard />} />
                                <Route path="library" element={<Library />} />
                                <Route path="analyze" element={<Analyze />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>
                        </Routes>
                    </Suspense>
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    )
}

export default App

