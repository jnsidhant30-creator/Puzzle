 /* Automated Word Filter & Content Sanitizer for PuzzleVerse */
const PROFANITY_LIST = [ 'badword', 'abuse', 'offensive', 'scam', 'hate', 'spam', 'idiot', 'cheat', 'exploit', 'hack',
]; export function containsProfanity(text: string): boolean { if (!text) return false; const lower = text.toLowerCase(); return PROFANITY_LIST.some((word) => { const regex = new RegExp(`\\b${word}\\b`, 'i'); return regex.test(lower); });
} export function sanitizeText(text: string): string { if (!text) return ''; let cleaned = text; PROFANITY_LIST.forEach((word) => { const regex = new RegExp(`\\b${word}\\b`, 'gi'); cleaned = cleaned.replace(regex, '***'); }); /* Sanitize potential HTML script tags */
cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); cleaned = cleaned.replace(/<[^>]+>/g, ''); return cleaned.trim();
}
