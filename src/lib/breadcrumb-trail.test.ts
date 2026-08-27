import { describe, expect, it } from 'vitest';
import { collapseTrail } from './breadcrumb-trail';

const trail = (count: number) =>
  Array.from({ length: count }, (_, index) => `f${index}`);

describe('collapseTrail', () => {
  it('leaves a shallow trail whole', () => {
    // Arrange - lead plus two is the most that fits without collapsing
    const result = collapseTrail(trail(3));

    // Assert
    expect(result.collapsed).toBe(false);
    expect(result.lead).toBe('f0');
    expect(result.hidden).toEqual([]);
    expect(result.shown).toEqual(['f1', 'f2']);
  });

  it('keeps the lead and the last two once it collapses', () => {
    // Arrange
    const result = collapseTrail(trail(6));

    // Assert - f0 leads, f4/f5 stay visible, the middle goes to the menu
    expect(result.collapsed).toBe(true);
    expect(result.lead).toBe('f0');
    expect(result.hidden).toEqual(['f1', 'f2', 'f3']);
    expect(result.shown).toEqual(['f4', 'f5']);
  });

  it('holds off collapsing at lead plus three', () => {
    // Arrange - the boundary: one folded entry is not worth a menu, so the
    // trail stays whole until there are two of them
    const result = collapseTrail(trail(4));

    // Assert
    expect(result.collapsed).toBe(false);
    expect(result.shown).toEqual(['f1', 'f2', 'f3']);
  });

  it('collapses at lead plus four', () => {
    // Arrange
    const result = collapseTrail(trail(5));

    // Assert
    expect(result.collapsed).toBe(true);
    expect(result.hidden).toEqual(['f1', 'f2']);
    expect(result.shown).toEqual(['f3', 'f4']);
  });

  it('never drops an entry', () => {
    // Arrange
    const result = collapseTrail(trail(9));

    // Assert
    expect([result.lead, ...result.hidden, ...result.shown]).toEqual(trail(9));
  });

  it('handles a single entry', () => {
    // Arrange
    const result = collapseTrail(trail(1));

    // Assert
    expect(result.lead).toBe('f0');
    expect(result.shown).toEqual([]);
    expect(result.collapsed).toBe(false);
  });

  it('handles an empty trail without throwing', () => {
    // Arrange
    const result = collapseTrail([]);

    // Assert
    expect(result.lead).toBeUndefined();
    expect(result.shown).toEqual([]);
    expect(result.collapsed).toBe(false);
  });

  it('honours a custom tail width', () => {
    // Arrange
    const result = collapseTrail(trail(6), 1);

    // Assert
    expect(result.hidden).toEqual(['f1', 'f2', 'f3', 'f4']);
    expect(result.shown).toEqual(['f5']);
  });
});
