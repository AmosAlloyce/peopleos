import React from 'react';
import { createRoot } from 'react-dom/client';
import Portfolio from './Portfolio.jsx';
import HrApp from './HrApp.jsx';
import './styles.css';

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="error-page">
        <h1>Let’s reconnect.</h1>
        <p>The workspace couldn’t finish loading. Reload to try again.</p>
        <button onClick={() => location.reload()}>Reload workspace</button>
        <a href="/">Back to portfolio</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {location.pathname.startsWith('/app') ? <HrApp /> : <Portfolio />}
    </ErrorBoundary>
  </React.StrictMode>,
);
