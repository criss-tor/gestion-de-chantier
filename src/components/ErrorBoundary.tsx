import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error in component tree', error, errorInfo);
    this.setState({ errorInfo });
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-bold text-destructive">Erreur inattendue</h1>
          <p className="mt-2 text-muted-foreground">Un problème est survenu dans l’application.</p>
          {this.state.error && (
            <pre className="mt-4 p-3 rounded bg-muted text-sm overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
          {this.state.errorInfo && (
            <pre className="mt-4 p-3 rounded bg-muted text-xs overflow-auto">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <div className="mt-4">
            <Button onClick={this.reset}>Revenir</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
