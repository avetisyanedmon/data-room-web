import { describe, expect, it } from 'vitest';
import { formatBytes, formatCount, initialsOf, splitFileName } from './format';

describe('formatBytes', () => {
  it('renders bytes below a kilobyte without decimals', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('scales past megabytes so room totals stay readable', () => {
    // The previous helper stopped at MB and printed "3400.0 MB" here.
    expect(formatBytes(3.4 * 1024 * 1024 * 1024)).toBe('3.4 GB');
  });

  it('accepts the BigInt-as-string totals the API sends', () => {
    expect(formatBytes('1048576')).toBe('1.0 MB');
  });

  it('treats missing or zero sizes as empty rather than NaN', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes('not-a-number')).toBe('0 B');
  });
});

describe('formatCount', () => {
  it('singularises a count of one', () => {
    expect(formatCount(1, 'item')).toBe('1 item');
    expect(formatCount(4, 'item')).toBe('4 items');
  });
});

describe('splitFileName', () => {
  it('splits the extension off a document name', () => {
    expect(splitFileName('Merger Agreement.pdf')).toEqual({
      stem: 'Merger Agreement',
      ext: '.pdf',
    });
  });

  it('leaves dotfiles and extensionless names whole', () => {
    expect(splitFileName('.gitignore')).toEqual({ stem: '.gitignore', ext: '' });
    expect(splitFileName('README')).toEqual({ stem: 'README', ext: '' });
  });
});

describe('initialsOf', () => {
  it('uses first and last initials for a full name', () => {
    expect(initialsOf('Sarah Jenkins')).toBe('SJ');
  });

  it('falls back to two letters for a single name', () => {
    expect(initialsOf('Marcus')).toBe('MA');
  });
});
