export async function persistThemeToServer(theme: unknown): Promise<{ ok: boolean; status: number; text?: string }> {
  try {
    const resp = await fetch('/api/admin/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ config: theme })
    });

    let text = '';
    try { text = await resp.text(); } catch (_) {}

    return { ok: resp.ok, status: resp.status, text };
  } catch (_err) {
    console.warn('persistThemeToServer error:', _err);
    return { ok: false, status: 0, text: String(_err) };
  }
}

export default persistThemeToServer;
