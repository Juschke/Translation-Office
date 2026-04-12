import DOMPurify from 'dompurify';

/**
 * Safe HTML configuration for sanitization
 * Only allows basic text formatting, no scripts or dangerous elements
 */
export const SAFE_HTML_CONFIG = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
        'blockquote', 'code', 'pre', 'a', 'img', 'h1', 'h2', 'h3'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
};

/**
 * Custom hooks to enforce additional security rules
 */
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Prevent javascript: and data: URLs
    const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:'];

    if (node.href) {
        const href = node.href.toLowerCase();
        const isAllowed = allowedProtocols.some(proto => href.startsWith(proto));

        if (!isAllowed) {
            node.removeAttribute('href');
        }
    }

    // Enforce rel="noopener noreferrer" for external links
    if (node.target === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
    }

    // Remove style attribute (can be used for XSS)
    if (node.hasAttribute('style')) {
        node.removeAttribute('style');
    }

    // Remove event handlers (just in case)
    Array.from(node.attributes || []).forEach(attr => {
        if (attr.name.startsWith('on')) {
            node.removeAttribute(attr.name);
        }
    });
});

/**
 * Sanitize HTML content to remove XSS attacks
 * Use for user-generated content like email bodies, notes, etc.
 */
export const sanitizeHtml = (dirty: string): string => {
    if (!dirty) return '';

    try {
        return DOMPurify.sanitize(dirty, SAFE_HTML_CONFIG);
    } catch (error) {
        console.error('HTML sanitization error:', error);
        // Return escaped text if sanitization fails
        return escapeHtml(dirty);
    }
};

/**
 * Escape HTML special characters
 * Use for plaintext that might be displayed as HTML
 */
export const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Sanitize plain text input (no HTML allowed)
 * Use for user names, email fields, etc.
 */
export const sanitizeText = (text: string): string => {
    return escapeHtml(text.trim());
};

/**
 * Validate URL safety before using in href
 */
export const isSafeUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url, window.location.href);
        const allowedProtocols = ['http:', 'https:', 'mailto:'];
        return allowedProtocols.includes(parsed.protocol);
    } catch {
        // Invalid URL
        return false;
    }
};
