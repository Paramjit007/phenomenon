/**
 * ErrorTriggerForTests — invisible helper that throws on render when
 *   window.__phenomenonForceError === <scope>
 * is set by a Playwright test. Used to verify error boundaries actually
 * catch render errors instead of letting the screen go blank.
 *
 * In production builds with no flag set, this component renders nothing
 * and has zero overhead.
 */
export default function ErrorTriggerForTests({ scope }) {
  if (typeof window !== "undefined" && window.__phenomenonForceError === scope) {
    throw new Error(`Test-induced render error in scope: ${scope}`);
  }
  return null;
}
