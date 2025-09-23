import React from 'react';
import { toast } from 'sonner';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

export class CanvasErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('CanvasErrorBoundary caught error:', error, info);
    try {
      toast.error(`Block failed to render - see console`);
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="component-error" style={{ padding: 16, border: '2px dashed #ef4444', borderRadius: 8, background: '#fff6f6', color: '#7f1d1d' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Block failed to render — check console for stack.
          </div>
          <div style={{ fontSize: 13 }}>{this.state.error?.message}</div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary;
