// Stub for dompurify — optional peer dependency, not installed in dev/test.
// Provides an identity sanitize so the dynamic import('dompurify') resolves
// and the sanitize path is exercised without the real dependency.
export default {
  sanitize: (html: string): string => html,
}
