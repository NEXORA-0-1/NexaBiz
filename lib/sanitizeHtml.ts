// lib/sanitizeHtml.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(dirty: string): string {
  if (typeof window === 'undefined') {
    return dirty
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '') // remove onload/onerror etc.
      .replace(/javascript:/gi, '')    // remove JS URLs
  }

  return DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })
}
