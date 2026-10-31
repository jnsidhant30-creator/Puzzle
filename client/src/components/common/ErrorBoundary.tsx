import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Check for chunk load errors or reference errors which are common during PWA/Vite updates
    const isChunkError = error.name === 'ChunkLoadError' || 
                         error.message.includes('Failed to fetch dynamically imported module') ||
                         error.name === 'ReferenceError' ||
                         error.message.includes('Importing a module script failed');
                         
    if (isChunkError) {
      // Prevent infinite reload loops by checking sessionStorage
      const reloadKey = 'pwa_chunk_error_reloaded';
      const lastReload = sessionStorage.getItem(reloadKey);
      
      if (!lastReload || (Date.now() - parseInt(lastReload)) > 10000) {
        sessionStorage.setItem(reloadKey, Date.now().toString());
        console.log('Chunk load error detected, triggering hard reload...');
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
            <h1 className="text-2xl font-bold text-textMain mb-2">Something went wrong</h1>
            <p className="text-textMuted mb-8">
              We encountered an unexpected error. Please try again.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.href = '/'}>
                Return Home
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
