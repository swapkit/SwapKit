import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("SwapKit Widget Error:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      return (
        <div className="w-full max-w-[360px] sm:max-w-[514px] mx-auto">
          <div className="bg-white/[0.08] rounded-[12px] p-4 sm:p-6 shadow-modal border border-border-primary">
            <h2 className="text-xl font-medium text-text-primary mb-3">Something went wrong</h2>
            <p className="text-sm text-text-secondary mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="w-full h-10 font-semibold px-4 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
