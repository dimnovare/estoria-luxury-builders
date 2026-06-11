import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  EMAIL_SIGNATURE_PEOPLE,
  type EmailSignaturePerson,
  buildSignatureHtml,
  buildSignatureText,
} from '@/lib/emailSignatures';

function copyRenderedSignature(html: string) {
  if (typeof document.execCommand !== 'function') {
    return false;
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  const selection = window.getSelection();

  try {
    const range = document.createRange();
    range.selectNodeContents(container);
    selection?.removeAllRanges();
    selection?.addRange(range);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    selection?.removeAllRanges();
    container.remove();
  }
}

async function copySignature(person: EmailSignaturePerson) {
  const html = buildSignatureHtml(person);
  const text = buildSignatureText(person);

  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      return;
    } catch {
      // Older or locked-down Outlook browsers may reject rich Clipboard API access.
    }
  }

  if (copyRenderedSignature(html)) {
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  throw new Error('Clipboard access is unavailable');
}

export default function EmailSignatures() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async (person: EmailSignaturePerson) => {
    try {
      await copySignature(person);
      setCopyError(false);
      setCopiedSlug(person.slug);
      window.setTimeout(() => setCopiedSlug(null), 2500);
    } catch {
      setCopiedSlug(null);
      setCopyError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-secondary/40 px-6 pb-12 pt-32">
        <div className="container mx-auto max-w-5xl">
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Estoria team resources
          </p>
          <h1 className="font-heading text-4xl font-light text-foreground md:text-6xl">
            Outlook email signatures
          </h1>
          <p className="mt-5 max-w-2xl font-body text-sm leading-7 text-muted-foreground md:text-base">
            Copy a ready-made signature below, then paste it directly into
            Outlook. The logo, links, spacing, and plain-text fallback are
            included.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="container mx-auto grid max-w-5xl gap-8">
          {EMAIL_SIGNATURE_PEOPLE.map((person) => {
            const isCopied = copiedSlug === person.slug;

            return (
              <article
                key={person.slug}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-heading text-2xl font-light text-foreground">
                      {person.name}
                    </h2>
                    <p className="mt-1 font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {person.role}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    aria-label={`Copy ${person.name} signature`}
                    onClick={() => handleCopy(person)}
                  >
                    {isCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                    {isCopied ? 'Signature copied' : 'Copy signature'}
                  </Button>
                </div>

                <div className="overflow-x-auto bg-white p-6 sm:p-10">
                  <div
                    className="min-w-[500px]"
                    dangerouslySetInnerHTML={{
                      __html: buildSignatureHtml(
                        person,
                        '/email-signature-logo.png',
                      ),
                    }}
                  />
                </div>
              </article>
            );
          })}

          {copyError && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 font-body text-sm text-destructive"
            >
              Clipboard access was blocked. Allow clipboard permission in your
              browser and try again.
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30 px-6 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-heading text-3xl font-light text-foreground">
            Add to Outlook
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-heading text-xl text-foreground">
                Outlook desktop
              </h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 font-body text-sm leading-6 text-muted-foreground">
                <li>Click the copy button for your signature.</li>
                <li>
                  Open Outlook and go to Settings, Accounts, then Signatures.
                </li>
                <li>Create a new signature and paste it into the editor.</li>
                <li>Choose it for new messages and replies, then save.</li>
              </ol>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-heading text-xl text-foreground">
                Outlook on the web
              </h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 font-body text-sm leading-6 text-muted-foreground">
                <li>Click the copy button for your signature.</li>
                <li>
                  Open Settings, Account, then Signatures in Outlook online.
                </li>
                <li>Create a new signature and paste it into the editor.</li>
                <li>Set the automatic signature options and save.</li>
              </ol>
            </div>
          </div>
          <p className="mt-6 font-body text-xs leading-5 text-muted-foreground">
            Keep the logo hosted at estoria.estate. Uploading or replacing it
            inside Outlook can alter its size or transparency.
          </p>
        </div>
      </section>
    </div>
  );
}
