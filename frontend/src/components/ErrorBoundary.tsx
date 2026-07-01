import { Component, ErrorInfo, ReactNode } from 'react'
import ServerError from '../pages/ServerError'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Catches uncaught errors anywhere in the component tree below it and
// renders the ServerError page instead of leaving the user on a blank
// white screen. This is the render-crash counterpart to the 404 catch-all
// route — NotFound handles "page doesn't exist", this handles "page broke".
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return <ServerError onRetry={this.handleRetry} />
    }
    return this.props.children
  }
}

export default ErrorBoundary
