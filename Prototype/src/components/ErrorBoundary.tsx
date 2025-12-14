import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Props for the ErrorBoundary component.
 */
interface Props {
    /** Child components to wrap with error boundary */
    children: ReactNode;
    /** Optional fallback component to render on error */
    fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component.
 */
interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors in child component tree.
 * Displays a fallback UI instead of crashing the whole app.
 * 
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
                    <div className="bg-slate-900 border border-red-500/50 rounded-xl p-8 max-w-lg w-full text-center">
                        <div className="bg-red-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            Terjadi Kesalahan
                        </h1>

                        <p className="text-slate-400 mb-6">
                            Aplikasi mengalami error yang tidak terduga. Silakan muat ulang halaman.
                        </p>

                        {this.state.error && (
                            <details className="text-left mb-6 bg-slate-800 p-4 rounded-lg">
                                <summary className="text-red-400 font-mono text-sm cursor-pointer">
                                    Detail Error
                                </summary>
                                <pre className="text-xs text-slate-300 mt-2 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Muat Ulang Halaman
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
