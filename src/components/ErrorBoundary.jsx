import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-bold text-red-600">Error en la página</h2>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-gray-800 bg-red-50 p-3 rounded">
            {this.state.error && this.state.error.toString()}
            {this.state.info && '\n\n' + (this.state.info.componentStack || '')}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
