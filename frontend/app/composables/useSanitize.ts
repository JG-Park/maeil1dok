import DOMPurify from 'dompurify';

export function useSanitize() {
  const sanitize = (html: string): string => {
    if (typeof window === 'undefined') {
      // SSR: return as-is, will be sanitized on client
      return html;
    }
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'span',
        'div',
        'strong',
        'em',
        'sup',
        'sub',
        'b',
        'i',
        'u',
        'h2',
        'h3',
        'h4',
        'a',
        'svg',
        'path'
      ],
      ALLOWED_ATTR: [
        'class',
        'style',
        'data-verse',
        'data-highlight-id',
        'data-footnote',
        'href',
        'target',
        'rel',
        'title',
        'xmlns',
        'viewBox',
        'fill',
        'stroke',
        'stroke-width',
        'stroke-linecap',
        'stroke-linejoin',
        'd',
        'width',
        'height'
      ]
    });
  };

  return { sanitize };
}
