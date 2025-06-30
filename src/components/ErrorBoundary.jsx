import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });

    // Optional: send to external service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <h2 style={styles.title}>Oops! Something went wrong.</h2>
          <button onClick={this.handleRetry} style={styles.button}>Retry</button>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={styles.details}>
              <summary style={styles.summary}>Error Details (dev only)</summary>
              <pre>{this.state.error && this.state.error.toString()}</pre>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    padding: '2rem',
    textAlign: 'center',
    color: '#c62828',
    backgroundColor: '#fff3f3',
    borderRadius: '8px',
    marginTop: '2rem',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxShadow: '0px 2px 10px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#c62828',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  details: {
    textAlign: 'left',
    marginTop: '1rem',
    backgroundColor: '#fff0f0',
    padding: '1rem',
    borderRadius: '4px',
    fontSize: '0.9rem'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default ErrorBoundary;
