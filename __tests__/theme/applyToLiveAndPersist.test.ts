import { applyThemeToLiveAndPersist } from '@/lib/theme/hooks/useRealTimePreview';
import { themeEngine } from '@/lib/theme/engine';

// Simple mock theme
const mockTheme = {
  id: 'test-theme',
  name: 'Test Theme',
  colors: { primary: '#000000', secondary: '#111111', accent: '#222222', neutral: {}, semantic: {} },
  gradients: {},
  typography: {},
  effects: {},
  metadata: { name: 'Test', author: 'test', version: '0.0.1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [] }
};

describe('applyThemeToLiveAndPersist', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200 }));
    // spy on themeEngine.saveTheme/applyTheme
    jest.spyOn(themeEngine, 'saveTheme').mockImplementation(async () => 'test-theme');
    jest.spyOn(themeEngine, 'applyTheme').mockImplementation(async () => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-ignore
    delete global.fetch;
  });

  it('persists theme to server via PUT /api/admin/theme', async () => {
    await applyThemeToLiveAndPersist(mockTheme as any);

    // @ts-ignore
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/theme', expect.objectContaining({ method: 'PUT' }));
  });
});
