import React from "react";
import { Link } from "react-router-dom";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for page-level crashes.
 * Shows a friendly message with Back to home and Reload buttons.
 */
export class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Page error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="nb-shell min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive/80 mb-4" />
            <h1 className="font-display text-2xl text-foreground mb-2">
              Something went wrong on this page
            </h1>
            <p className="text-[13px] text-muted-foreground mb-6">
              The page crashed unexpectedly. Your data is safe in local storage.
            </p>
            {this.state.error && (
              <details className="mb-4 text-left rounded-md border border-border/60 bg-card/50 p-3 text-[11px] font-mono text-destructive/90">
                <summary className="cursor-pointer mb-1">Error details</summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && `\n\n${this.state.errorInfo.componentStack}`}
                </pre>
              </details>
            )}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleReload}
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload page
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 gap-2"
              >
                <Link to="/">
                  <Home className="h-3.5 w-3.5" />
                  Back to home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Wrapper that applies the error boundary to a page component.
 */
export function withPageErrorBoundary(Component) {
  return function WrappedPage(props) {
    return (
      <PageErrorBoundary>
        <Component {...props} />
      </PageErrorBoundary>
    );
  };
}