import type { ComponentInstance } from './types'

export class PositioningSystem {
  // Minimal stub implementation to satisfy parser and linter.
  // Full implementation lives elsewhere; this stub preserves public API used by the app.
  getPosition(_component: ComponentInstance) {
    return { x: 0, y: 0 };
  }
}