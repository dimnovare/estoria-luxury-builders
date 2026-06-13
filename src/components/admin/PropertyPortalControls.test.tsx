import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import PropertyPortalControls from '@/components/admin/PropertyPortalControls';

// Force English so label assertions are deterministic regardless of detected lang.
i18n.changeLanguage('en');

describe('PropertyPortalControls', () => {
  it('renders discovered portals and reports switch changes', () => {
    const onChange = vi.fn();
    render(
      <PropertyPortalControls
        portals={[{ key: 'kinnisvara24', displayName: 'Kinnisvara24', feedUrl: '/kinnisvara24.xml' }]}
        values={{ kinnisvara24: false }}
        states={{}}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Publish to Kinnisvara24' }));
    expect(onChange).toHaveBeenCalledWith('kinnisvara24', true);
  });

  it('shows adapter validation errors beside the portal', () => {
    render(
      <PropertyPortalControls
        portals={[{ key: 'kinnisvara24', displayName: 'Kinnisvara24', feedUrl: '/kinnisvara24.xml' }]}
        values={{ kinnisvara24: true }}
        states={{
          kinnisvara24: {
            isEnabled: true,
            validationErrors: ['The property location is not mapped for Kinnisvara24.'],
          },
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/location is not mapped/i)).toBeVisible();
  });
});
