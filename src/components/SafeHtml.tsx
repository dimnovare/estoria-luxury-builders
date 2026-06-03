import { createElement, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

type SafeHtmlProps = {
  /** Raw HTML string (CMS rich-text: blog, property, page content, bios). */
  html: string | null | undefined;
  className?: string;
  /** Element tag to render into. Defaults to a block-level div. */
  as?: keyof JSX.IntrinsicElements;
};

/**
 * Renders CMS rich-text after sanitizing it with DOMPurify.
 *
 * All such content is authored by trusted admins, so this is defense-in-depth:
 * a compromised admin account (or a future public-submitted field) can't inject
 * executable markup into a public page. Sanitization is applied through one
 * reviewed component instead of scattered inline calls.
 *
 * Implementation: DOMPurify returns a sanitized DocumentFragment, which we swap
 * in with the safe `replaceChildren` DOM method — no raw-HTML React prop and no
 * string HTML assignment anywhere. This is a fully client-rendered Vite SPA
 * (no SSR), so there is no server markup to lose.
 */
export function SafeHtml({ html, className, as = 'div' }: SafeHtmlProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fragment = DOMPurify.sanitize(html ?? '', { RETURN_DOM_FRAGMENT: true });
    el.replaceChildren(fragment);
  }, [html]);

  return createElement(as, { ref, className });
}
