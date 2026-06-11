import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EMAIL_SIGNATURE_PEOPLE,
  buildSignatureHtml,
  buildStandaloneSignatureDocument,
  buildSignatureText,
} from '@/lib/emailSignatures';

describe('Estoria email signatures', () => {
  it('contains the verified contact details for Nelia and Julia', () => {
    expect(EMAIL_SIGNATURE_PEOPLE).toEqual([
      {
        slug: 'nelia-novare',
        name: 'Nelia Novare',
        role: 'Real Estate Expert',
        phoneDisplay: '+372 5555 4722',
        phoneHref: '+37255554722',
        email: 'nelia@estoria.estate',
      },
      {
        slug: 'julia-berg',
        name: 'Julia Berg',
        role: 'Real Estate Expert',
        phoneDisplay: '+372 5870 8330',
        phoneHref: '+37258708330',
        email: 'julia@estoria.estate',
      },
    ]);
  });

  it.each(EMAIL_SIGNATURE_PEOPLE)(
    'generates Outlook-safe rich HTML for $name',
    (person) => {
      const html = buildSignatureHtml(person);

      expect(html).toContain('<table');
      expect(html).toContain('style="');
      expect(html).toContain('https://estoria.estate/email-signature-logo.png');
      expect(html).toContain(`href="tel:${person.phoneHref}"`);
      expect(html).toContain(`href="mailto:${person.email}"`);
      expect(html).toContain('href="https://estoria.estate"');
      expect(html).toContain(person.name);
      expect(html).toContain(person.role);
      expect(html).not.toMatch(/\b(?:flex|grid)\b/i);
      expect(html).not.toMatch(/<svg|\.webp/i);
    },
  );

  it.each(EMAIL_SIGNATURE_PEOPLE)(
    'generates a matching plain-text fallback for $name',
    (person) => {
      const text = buildSignatureText(person);

      expect(text).toContain(person.name);
      expect(text).toContain(person.role);
      expect(text).toContain(person.phoneDisplay);
      expect(text).toContain(person.email);
      expect(text).toContain('https://estoria.estate');
      expect(text).toContain('Tallinn, Estonia');
    },
  );

  it.each(EMAIL_SIGNATURE_PEOPLE)(
    'keeps the standalone HTML file for $name in sync',
    (person) => {
      const file = readFileSync(
        resolve('public', 'email-signatures', `${person.slug}.html`),
        'utf8',
      );

      expect(file.trim()).toBe(buildStandaloneSignatureDocument(person));
    },
  );
});
