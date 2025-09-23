import { themeEngine } from '@/lib/theme/engine';
import { Theme } from '@/lib/theme/types';

describe('themeEngine.applyTheme', () => {
  it('applies a minimal valid theme without throwing', async () => {
    const theme: Theme = themeEngine.getDefaultTheme();
    // Should not throw
    await expect(themeEngine.applyTheme(theme)).resolves.toBeUndefined();
  });
});
