/**
 * Guards for the explorer's window-level shortcuts.
 *
 * The list shortcuts live on `window` because the rows themselves are not a
 * focus container. Radix portals its dialogs and menus outside the explorer's
 * subtree, but keydown still bubbles all the way up — so without these checks
 * the list acts on keys that belong to whatever is open on top of it. Pressing
 * Enter on a confirmation's Cancel button used to navigate to the active row
 * and swallow the button's own activation, bypassing the confirmation.
 */

/** Radix marks its open overlays with `data-state`, whatever the portal root. */
const OVERLAY_SELECTOR = [
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[role="menu"][data-state="open"]',
].join(', ');

/** True while a dialog, alert dialog or dropdown menu is on screen. */
export function isOverlayOpen(root: ParentNode = document): boolean {
  return root.querySelector(OVERLAY_SELECTOR) !== null;
}

/**
 * True when the key belongs to a text field. Matched by `closest` rather than
 * by tag name so a custom control wrapping an input is covered too.
 */
export function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return target.closest('input, textarea, select, [contenteditable="true"]') !== null;
}
