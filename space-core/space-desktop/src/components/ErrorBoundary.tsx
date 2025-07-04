import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error | string, details?: string) => Promise<void>;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      errorStack: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message,
      errorStack: error.stack || ''
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the parent's error handler if provided
    if (this.props.onError) {
      this.props.onError(error, `Component stack: ${errorInfo.componentStack}`).catch(err => {
        console.error('Failed to report error to parent:', err);
      });
    }
    
    // Report error to main process if available
    if (window.electronAPI && window.electronAPI.logError) {
      window.electronAPI.logError({
        message: error.message,
        stack: error.stack || '',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        componentStack: errorInfo.componentStack
      }).catch(err => {
        console.error('Failed to log error to main process:', err);
      });
    }
  }

  handleReload = () => {
    if (window.electronAPI && window.electronAPI.devReload) {
      // Use dev reload if available
      window.electronAPI.devReload();
    } else {
      window.location.reload();
    }
  };

  handleReportBug = async () => {
    if (window.electronAPI && window.electronAPI.reportBug) {
      try {
        await window.electronAPI.reportBug({
          title: 'Unhandled React Error',
          description: this.state.errorMessage,
          steps: ['Error occurred during React component rendering'],
          severity: 'high',
          category: 'frontend',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
        
        alert('Bug report submitted successfully!');
      } catch (error) {
        console.error('Failed to submit bug report:', error);
        alert('Failed to submit bug report. Please check the console for details.');
      }
    } else {
      alert('Bug reporting not available in this mode.');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>🚨 Something went wrong</h2>
            <p>Space encountered an unexpected error. We apologize for the inconvenience.</p>
            
            <details className="error-details">
              <summary>Error Details</summary>
              <div className="error-info">
                <h4>Error Message:</h4>
                <pre className="error-message">{this.state.errorMessage}</pre>
                
                <h4>Stack Trace:</h4>
                <pre className="error-stack">{this.state.errorStack}</pre>
                
                <h4>Environment:</h4>
                <ul>
                  <li>Platform: {window.appConfig?.platform || 'Unknown'}</li>
                  <li>Version: {window.appConfig?.version || 'Unknown'}</li>
                  <li>Development: {window.appConfig?.isDevelopment ? 'Yes' : 'No'}</li>
                  <li>Timestamp: {new Date().toISOString()}</li>
                </ul>
              </div>
            </details>

            <div className="error-actions">
              <button 
                className="btn btn-primary" 
                onClick={this.handleReload}
              >
                🔄 Reload Application
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={this.handleReportBug}
              >
                📤 Report Bug
              </button>
            </div>

            <div className="error-help">
              <h3>Troubleshooting Steps:</h3>
              <ul>
                <li>Try reloading the application</li>
                <li>Check that all system requirements are met</li>
                <li>Verify Fusion 360 is properly installed (if using CAD features)</li>
                <li>Ensure your API key is valid (if using AI features)</li>
                <li>Restart the application completely</li>
                <li>Report this bug if the problem persists</li>
              </ul>
              
              {window.appConfig?.isDevelopment && (
                <div className="dev-info">
                  <h4>Development Info:</h4>
                  <p>Running in development mode. Check the console for additional details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 