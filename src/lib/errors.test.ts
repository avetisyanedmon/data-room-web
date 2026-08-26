import { describe, expect, it } from 'vitest';
import { getErrorMessage, isForbidden, isGoneOrDenied, isNotFound } from './errors';

describe('getErrorMessage', () => {
  it('reads the API error envelope', () => {
    expect(getErrorMessage({ status: 400, data: { message: 'Folder not found' } })).toBe(
      'Folder not found',
    );
  });

  it('joins the array form validation failures use', () => {
    expect(getErrorMessage({ status: 400, data: { message: ['name: too short', 'name: required'] } })).toBe(
      'name: too short, name: required',
    );
  });

  it('falls back when the server said nothing useful', () => {
    expect(getErrorMessage({ status: 500 }, 'Upload failed')).toBe('Upload failed');
  });
});

describe('status helpers', () => {
  it('separates "not yours" from "not there"', () => {
    // 403 drives the wrong-account screen; 404 drives the deleted screen.
    expect(isForbidden({ status: 403 })).toBe(true);
    expect(isNotFound({ status: 403 })).toBe(false);
    expect(isNotFound({ status: 404 })).toBe(true);
    expect(isGoneOrDenied({ status: 410 })).toBe(true);
    expect(isGoneOrDenied({ status: 500 })).toBe(false);
  });
});
