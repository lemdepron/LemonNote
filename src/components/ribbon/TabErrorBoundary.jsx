import { Component } from "react";

/**
 * Error boundary that catches render errors in a single ribbon tab.
 * If a tab crashes, it shows "This tab failed to load" with the error text
 * inside that tab, and the rest of the page keeps working.
 */
export class TabErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Ribbon tab error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const message = error?.message || "Unknown error";
      const stack = error?.stack || "";
      
      return (
        <div className="flex w-full items-center justify-center p-4 text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="text-center">
            <p className="font-medium">This tab failed to load</p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
              {message}
            </p>
            {stack && (
              <details className="mt-2 text-left">
                <summary className="cursor-pointer font-mono text-[9px] text-muted-foreground/70">
                  Show error details
                </summary>
                <pre className="mt-2 p-2 rounded bg-muted/50 font-mono text-[9px] overflow-auto max-h-[200px] whitespace-pre-wrap">
                  {stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}