/** Flags a legal/company page as generic boilerplate, not OmniSift's actual
 * reviewed policy — visible on the page itself so nobody mistakes placeholder
 * text for something legally binding. Remove this component's usage once the
 * page has real, reviewed content. */
export function PlaceholderNotice() {
  return (
    <div className="placeholder-notice">
      <strong>Placeholder content.</strong> This page hasn&apos;t been written or reviewed yet —
      it exists so the link isn&apos;t broken. Replace it with OmniSift&apos;s actual, reviewed
      text before relying on it.
    </div>
  );
}
