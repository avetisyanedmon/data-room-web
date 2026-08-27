/** Entries kept visible after the lead once a trail collapses. */
export const VISIBLE_TAIL = 2;

export type CollapsedTrail<T> = {
  /** The first entry, which anchors the trail and is rendered on its own. */
  lead: T | undefined;
  /** Middle entries folded into a menu; empty while the trail is short. */
  hidden: T[];
  /** Entries rendered after the lead, the last of which is the current page. */
  shown: T[];
  collapsed: boolean;
};

/**
 * Splits a breadcrumb into lead, folded middle and visible tail.
 *
 * Shared by the signed-in explorer and the public link surface: they differ in
 * where their links point and how they are painted, but a deep path collapses
 * the same way in both, and no entry is ever dropped.
 */
export function collapseTrail<T>(
  items: readonly T[],
  visibleTail: number = VISIBLE_TAIL,
): CollapsedTrail<T> {
  const [lead, ...rest] = items;
  const collapsed = rest.length > visibleTail + 1;

  return {
    lead,
    collapsed,
    hidden: collapsed ? rest.slice(0, rest.length - visibleTail) : [],
    shown: collapsed ? rest.slice(rest.length - visibleTail) : rest,
  };
}
