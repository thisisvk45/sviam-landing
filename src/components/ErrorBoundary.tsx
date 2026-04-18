"use client";

import { Component, ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: string };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            className="p-8 rounded-[16px] text-center"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-sm text-[var(--muted2)] mb-2"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Something went wrong
            </p>
            <p
              className="text-xs text-[var(--muted)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              {this.state.error}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: "" })}
              className="mt-4 px-4 py-2 rounded-[8px] text-xs text-white"
              style={{ background: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
