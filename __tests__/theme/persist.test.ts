import persistThemeToServer from '@/lib/theme/persist';

describe('persistThemeToServer', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('ok') }));
  });

  afterEach(() => {
    // @ts-ignore
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it('calls PUT /api/admin/theme', async () => {
    const theme = { id: 't1' };
    const result = await persistThemeToServer(theme);

    // @ts-ignore
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/theme', expect.objectContaining({ method: 'PUT' }));
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });
});
