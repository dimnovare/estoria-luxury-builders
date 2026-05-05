import { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // i18n.t works outside the React tree — used here because class
      // components can't call hooks directly.
      const t = i18n.t.bind(i18n);
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-16 h-px gold-gradient mx-auto mb-8" />
            <h1 className="font-heading text-4xl text-foreground mb-4">{t('errors.boundaryTitle')}</h1>
            <p className="text-muted-foreground font-body mb-8 max-w-md mx-auto">
              {t('errors.boundaryMessage')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="font-nav text-xs uppercase tracking-[0.15em] border border-primary text-primary px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              {t('errors.boundaryReload')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
