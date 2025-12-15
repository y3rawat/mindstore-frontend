import React from 'react';
import './ErrorBoundary.css';

/**
 * Error Boundary component to catch React rendering errors
 * Prevents the entire app from crashing on component errors
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        console.error('🚨 ErrorBoundary caught an error:', error);
        console.error('Component stack:', errorInfo.componentStack);

        this.setState({ errorInfo });

        // TODO: Send error to monitoring service (e.g., Sentry)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI or use the provided one
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <span className="error-icon">⚠️</span>
                        <h2>Something went wrong</h2>
                        <p className="error-message">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <div className="error-actions">
                            <button
                                className="btn btn-primary"
                                onClick={this.handleRetry}
                            >
                                🔄 Try Again
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => window.location.reload()}
                            >
                                🔃 Reload Page
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className="error-details">
                                <summary>Error Details (Dev Mode)</summary>
                                <pre>{this.state.error?.toString()}</pre>
                                <pre>{this.state.errorInfo.componentStack}</pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
