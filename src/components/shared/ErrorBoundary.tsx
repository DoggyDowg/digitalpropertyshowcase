'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error(`Error caught by ErrorBoundary${this.props.componentName ? ` (${this.props.componentName})` : ''}:`, {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    })

    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // You could also send error reports to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or default
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center p-6 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {this.props.componentName ? `${this.props.componentName} Unavailable` : 'Content Unavailable'}
            </h3>
            <p className="text-gray-600 mb-4">
              This section is temporarily unavailable. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined, errorInfo: undefined })
                window.location.reload()
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier use
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
  componentName?: string
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} componentName={componentName}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithErrorBoundaryComponent
}

// Lightweight error boundary for non-critical components
export function LightweightErrorBoundary({ children, componentName }: { children: ReactNode; componentName?: string }) {
  return (
    <ErrorBoundary 
      componentName={componentName}
      fallback={
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            {componentName ? `${componentName} temporarily unavailable` : 'Content temporarily unavailable'}
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
} 