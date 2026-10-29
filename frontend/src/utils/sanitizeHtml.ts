/**
 * Sanitizes HTML from the API (blog posts, HubSpot notes) before it is passed to
 * dangerouslySetInnerHTML. Strips scripts, event handlers and javascript: URLs.
 */
import DOMPurify from 'dompurify';

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Links that open a new tab must not hand window.opener to the target page.
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export const sanitizeHtml = (html?: string | null): string =>
  html ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) : '';
