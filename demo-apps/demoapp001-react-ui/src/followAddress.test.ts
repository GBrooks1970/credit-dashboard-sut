import { describe, expect, it, vi } from 'vitest';

import { followAddress } from './safeRedirect.ts';

// The `open-redirect` bug flag (test build only) removes the guard, so an address that leaves the site comes out of `safeRedirect`. What it
// does then is what an open redirect does: the browser goes there. React Router refuses an external address (CDS-48, review finding A-01),
// so the page hands it to the browser itself. With the guard on, only a path on this site ever reaches this function.
describe('followAddress: a path stays in the app, an address on another site leaves it', () => {
  it.each(['/credit-health/debt-overview', '/credit-health/report/bureau-a/account/acc_ddcc01?x=1#top'])('a path on this site is a router navigation: %s', (path) => {
    const navigate = vi.fn();
    const assign = vi.fn();
    followAddress(navigate, path, assign);
    expect(navigate).toHaveBeenCalledWith(path, { replace: true });
    expect(assign).not.toHaveBeenCalled();
  });

  it.each(['https://evil.example/steal', 'http://evil.example/', '//evil.example/steal', 'javascript:alert(1)', 'HTTPS://EVIL.EXAMPLE/'])(
    'an address that leaves the site is handed to the browser: %s',
    (address) => {
      const navigate = vi.fn();
      const assign = vi.fn();
      followAddress(navigate, address, assign);
      expect(assign).toHaveBeenCalledWith(address);
      expect(navigate).not.toHaveBeenCalled();
    },
  );
});
