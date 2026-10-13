'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6 text-center">
          <span className="text-4xl"></span>
          <div>
            <h3 className="font-semibold text-ink">Something went wrong</h3>
            <p className="text-sm text-ink-muted mt-1">{this.state.error?.message}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={this.reset}>Try again</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Async error display ──────────────────────────────────────────────────────

export const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-8 text-center">
    <span className="text-3xl">😕</span>
    <p className="text-sm text-ink-muted">{message}</p>
    {onRetry && <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>}
  </div>
);
