import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in 3D Studio:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('interior_studio_active_project_id');
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  private handleClearAllAndReload = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">3D Studio Encountered an Issue</h2>
            <p className="text-sm text-slate-400">
              The studio encountered an unexpected error while initializing the 3D scene.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-left text-xs font-mono text-red-400 overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Studio
              </button>
              <button
                onClick={this.handleClearAllAndReload}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <Home className="w-4 h-4" />
                Reset Canvas
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
