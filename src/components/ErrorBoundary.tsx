import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            textAlign: 'center',
            background: 'var(--bg)',
            color: 'var(--text)',
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: '-2px',
              marginBottom: 24,
              display: 'inline-flex',
              alignItems: 'baseline',
            }}
          >
            MØRA
            <span
              style={{
                color: 'var(--accent)',
                display: 'inline-block',
              }}
            >
              .
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: '3px',
                color: 'var(--muted)',
                marginLeft: 6,
                textTransform: 'uppercase',
              }}
            >
              MART
            </span>
          </div>
          <h1
            className="serif"
            style={{ fontSize: 32, marginBottom: 16, fontWeight: 900 }}
          >
            Что-то пошло не так
          </h1>
          <p style={{ color: 'var(--muted)', marginBottom: 24, maxWidth: 400 }}>
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </p>

          {isDev && this.state.message && (
            <pre
              style={{
                maxWidth: 600,
                padding: 16,
                background: '#1a1a1a',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: '#ff6b6b',
                fontSize: 12,
                textAlign: 'left',
                overflow: 'auto',
                marginBottom: 24,
              }}
            >
              {this.state.message}
            </pre>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '16px 32px',
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 100,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Попробовать снова
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '16px 32px',
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: 100,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;