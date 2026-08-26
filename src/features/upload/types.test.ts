import { describe, expect, it } from 'vitest';
import { MAX_FILE_BYTES, isPdf, rejectionReason } from './types';

function fileOf(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('isPdf', () => {
  it('accepts a PDF by mime type', () => {
    expect(isPdf(fileOf('a.pdf', 'application/pdf', 10))).toBe(true);
  });

  it('accepts a PDF whose mime type the browser did not set', () => {
    expect(isPdf(fileOf('Contract.PDF', '', 10))).toBe(true);
  });

  it('rejects other document types', () => {
    expect(isPdf(fileOf('sheet.xlsx', 'application/vnd.ms-excel', 10))).toBe(false);
  });
});

describe('rejectionReason', () => {
  it('passes a valid PDF', () => {
    expect(rejectionReason(fileOf('ok.pdf', 'application/pdf', 1024))).toBeNull();
  });

  it('explains a non-PDF instead of dropping it silently', () => {
    expect(rejectionReason(fileOf('notes.txt', 'text/plain', 10))).toBe(
      'Only PDF files can be uploaded',
    );
  });

  it('states the size limit that was exceeded', () => {
    expect(rejectionReason(fileOf('big.pdf', 'application/pdf', MAX_FILE_BYTES + 1))).toBe(
      'Larger than the 20 MB limit',
    );
  });

  it('rejects an empty file', () => {
    expect(rejectionReason(fileOf('empty.pdf', 'application/pdf', 0))).toBe('File is empty');
  });
});
