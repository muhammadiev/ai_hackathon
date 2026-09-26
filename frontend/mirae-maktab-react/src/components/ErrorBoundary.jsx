import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI xatosi:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Nimadir xato ketdi</div>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 18 }}>{this.state.error.message}</div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', borderRadius: 10, background: '#3D7DF6', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            Sahifani qayta yuklash
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}