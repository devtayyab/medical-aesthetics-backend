/**
 * Greek capitals are written without accents ("ΑΘΗΝΑ", not "ΑΘΉΝΑ").
 *
 * - `toGreekUpperCase` for JS uppercasing.
 * - `installGreekUppercaseFix` for CSS `text-transform: uppercase` (Tailwind `uppercase`):
 *   browsers only drop accents when the element language is Greek, and not all of them do it,
 *   so accented Greek letters inside uppercased elements are replaced by their plain form.
 */

const GREEK_ACCENTED = /[ΆΈ-ΊΌΎ-ΐά-ΰό-ώἀ-῿]/;

/** Removes the Greek tonos (acute accent) and keeps the dialytika: "Ακμή" -> "Ακμη", "ΐ" -> "ϊ". */
export const stripGreekTonos = (text: string): string => {
  if (!text || !GREEK_ACCENTED.test(text)) return text;
  return text
    .normalize('NFD')
    .replace(/[́́͂̓̔ͅ]/g, '')
    .normalize('NFC');
};

/** Uppercase that follows Greek rules: no accents on capitals. */
export const toGreekUpperCase = (text: string | null | undefined): string =>
  stripGreekTonos(String(text ?? '')).toLocaleUpperCase('el');

const isUppercased = (el: Element | null): boolean => {
  if (!el || (el as HTMLElement).isContentEditable) return false;
  try {
    return window.getComputedStyle(el).textTransform === 'uppercase';
  } catch {
    return false;
  }
};

const fixTextNode = (node: Node) => {
  const value = node.nodeValue;
  if (!value || !GREEK_ACCENTED.test(value)) return;
  if (!isUppercased(node.parentElement)) return;
  const fixed = stripGreekTonos(value);
  if (fixed !== value) node.nodeValue = fixed;
};

const fixTree = (root: Node) => {
  if (root.nodeType === Node.TEXT_NODE) {
    fixTextNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const tag = (root as Element).tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    fixTextNode(current);
    current = walker.nextNode();
  }
};

let installed = false;

/** Watches the DOM and removes accents from Greek text shown in uppercase. Call once at startup. */
export const installGreekUppercaseFix = () => {
  if (installed || typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;
  installed = true;

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') {
        fixTextNode(m.target);
      } else {
        m.addedNodes.forEach((n) => fixTree(n));
      }
    }
  });

  const start = () => {
    fixTree(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };

  if (document.body) start();
  else window.addEventListener('DOMContentLoaded', start, { once: true });
};
