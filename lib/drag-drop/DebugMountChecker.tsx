"use client";

import React from 'react';

export function DebugMountChecker() {
  const log = () => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line no-console
    console.info('[DND CHECKER] __DND_DEBUG =', (window as any).__DND_DEBUG);
    // eslint-disable-next-line no-console
    console.info('[DND CHECKER] __DND_DEBUG_INSTALLED =', (window as any).__DND_DEBUG_INSTALLED);
    // eslint-disable-next-line no-console
    console.info('[DND CHECKER] body[data-dnd-provider] =', document.body.getAttribute('data-dnd-provider'));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={log}
        className="px-3 py-2 bg-gray-800 text-white rounded shadow"
        type="button"
      >
        DnD Check
      </button>
    </div>
  );
}

export default DebugMountChecker;
