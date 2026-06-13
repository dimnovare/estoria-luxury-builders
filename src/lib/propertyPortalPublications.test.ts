import { describe, expect, it } from 'vitest';
import { initializePortalPublications } from '@/lib/propertyPortalPublications';

const portals = [
  { key: 'kinnisvara24', displayName: 'Kinnisvara24', feedUrl: '/kinnisvara24.xml' },
  { key: 'second', displayName: 'Second', feedUrl: '/second.xml' },
];

describe('initializePortalPublications', () => {
  it('defaults every registered portal to off', () => {
    expect(initializePortalPublications(portals)).toEqual({
      kinnisvara24: false,
      second: false,
    });
  });

  it('hydrates saved state but still returns a complete map', () => {
    expect(initializePortalPublications(portals, {
      kinnisvara24: { isEnabled: true, validationErrors: [] },
    })).toEqual({
      kinnisvara24: true,
      second: false,
    });
  });
});
