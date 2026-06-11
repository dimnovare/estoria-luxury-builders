import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EmailSignatures from '@/pages/EmailSignatures';

const clipboardWrite = vi.fn();
const clipboardWriteText = vi.fn();
const execCommand = vi.fn();

class ClipboardItemMock {
  readonly data: Record<string, Blob>;

  constructor(data: Record<string, Blob>) {
    this.data = data;
  }
}

describe('EmailSignatures', () => {
  beforeEach(() => {
    clipboardWrite.mockReset();
    clipboardWrite.mockResolvedValue(undefined);
    clipboardWriteText.mockReset();
    clipboardWriteText.mockResolvedValue(undefined);
    execCommand.mockReset();
    execCommand.mockReturnValue(true);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: clipboardWrite,
        writeText: clipboardWriteText,
      },
    });
    vi.stubGlobal('ClipboardItem', ClipboardItemMock);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });
  });

  it('shows both signatures and Outlook setup instructions', () => {
    const { container } = render(<EmailSignatures />);

    expect(screen.getAllByText('Nelia Novare')).toHaveLength(2);
    expect(screen.getAllByText('Julia Berg')).toHaveLength(2);
    expect(
      screen.getByRole('heading', { name: 'Add to Outlook' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Settings.*Signatures/i)).toHaveLength(2);
    expect(
      Array.from(container.querySelectorAll('img')).map((image) =>
        image.getAttribute('src'),
      ),
    ).toEqual([
      '/email-signature-logo.png',
      '/email-signature-logo.png',
    ]);
  });

  it('copies rich HTML and plain text for the selected person', async () => {
    render(<EmailSignatures />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Copy Nelia Novare signature' }),
    );

    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledOnce());

    const [items] = clipboardWrite.mock.calls[0];
    const item = items[0] as ClipboardItemMock;

    expect(Object.keys(item.data)).toEqual(['text/html', 'text/plain']);
    await expect(item.data['text/html'].text()).resolves.toContain(
      'Nelia Novare',
    );
    await expect(item.data['text/plain'].text()).resolves.toContain(
      'nelia@estoria.estate',
    );
    expect(screen.getByText('Signature copied')).toBeInTheDocument();
  });

  it('falls back to rendered rich copy when clipboard permissions are blocked', async () => {
    clipboardWrite.mockRejectedValueOnce(new Error('Not allowed'));
    render(<EmailSignatures />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Copy Julia Berg signature' }),
    );

    await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
    expect(screen.getByText('Signature copied')).toBeInTheDocument();
  });

  it('uses plain text when neither rich-copy method is available', async () => {
    clipboardWrite.mockRejectedValueOnce(new Error('Not allowed'));
    execCommand.mockImplementationOnce(() => {
      throw new Error('Not supported');
    });
    render(<EmailSignatures />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Copy Julia Berg signature' }),
    );

    await waitFor(() => expect(clipboardWriteText).toHaveBeenCalledOnce());
    expect(clipboardWriteText.mock.calls[0][0]).toContain(
      'julia@estoria.estate',
    );
    expect(screen.getByText('Signature copied')).toBeInTheDocument();
  });
});
