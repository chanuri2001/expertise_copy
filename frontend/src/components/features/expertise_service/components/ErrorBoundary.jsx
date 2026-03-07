import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: '40px', background: '#fee2e2', color: '#991b1b', height: '100vh', width: '100vw', zIndex: 999999, position: 'fixed', top: 0, left: 0 }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>System Crash Detected</h1>
                    <p style={{ marginBottom: '8px' }}>The application encountered an unexpected runtime error.</p>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', overflowX: 'auto' }}>
                        <p style={{ fontWeight: 'bold', color: '#b91c1c' }}>{this.state.error && this.state.error.toString()}</p>
                        <br />
                        <pre style={{ fontSize: '12px', color: '#450a0a' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', padding: '12px 24px', background: '#991b1b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
