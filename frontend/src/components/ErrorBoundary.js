import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-light-300 dark:bg-dark-400 p-4">
          <div className="glass-card p-8 max-w-md w-full">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                <FiAlertTriangle className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-semibold text-center mb-4">Something went wrong</h1>
            <p className="text-light-800 dark:text-light-500 text-center mb-6">
              We're sorry, but there was an error in the application. Please try refreshing the page.
            </p>
            <div className="text-center">
              <button
                onClick={() => window.location.reload()}
                className="primary-button"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-red-800 dark:text-red-300 text-sm font-mono overflow-auto max-h-64">
              <p className="font-semibold">Error Details:</p>
              <p>{this.state.error.toString()}</p>
              <p className="mt-2 font-semibold">Component Stack:</p>
              <p>{this.state.errorInfo.componentStack}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return this.props.children;
}
}

export default ErrorBoundary;