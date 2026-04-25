import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-5 gap-4">
          <div className="text-5xl">😵</div>
          <h1 className="text-xl font-bold text-text-primary">Etwas ist schiefgelaufen</h1>
          <p className="text-sm text-text-secondary text-center max-w-sm">
            {this.state.error?.message ?? 'Ein unerwarteter Fehler ist aufgetreten.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.href = import.meta.env.BASE_URL
            }}
            className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
