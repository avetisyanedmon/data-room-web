import { afterEach, describe, expect, it } from 'vitest';
import { isOverlayOpen, isTextEntry } from './keyboard';

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(html: string) {
  document.body.innerHTML = html;
  return document.body;
}

describe('isOverlayOpen', () => {
  it('is false on a bare explorer', () => {
    // Arrange
    mount('<div role="rowgroup"><div role="row">A file</div></div>');

    // Assert
    expect(isOverlayOpen()).toBe(false);
  });

  it('sees an open dialog', () => {
    // Arrange - what Radix renders into its portal
    mount('<div role="dialog" data-state="open">Delete "Report.pdf"?</div>');

    // Assert
    expect(isOverlayOpen()).toBe(true);
  });

  it('sees an open dropdown menu', () => {
    // Arrange - the row's ⋮ menu owns its own arrow keys
    mount('<div role="menu" data-state="open"><div role="menuitem">Rename</div></div>');

    // Assert
    expect(isOverlayOpen()).toBe(true);
  });

  it('sees an open alert dialog', () => {
    // Arrange
    mount('<div role="alertdialog" data-state="open">Are you sure?</div>');

    // Assert
    expect(isOverlayOpen()).toBe(true);
  });

  it('ignores a dialog that has closed', () => {
    // Arrange - Radix keeps the node around while it animates out
    mount('<div role="dialog" data-state="closed">Delete "Report.pdf"?</div>');

    // Assert
    expect(isOverlayOpen()).toBe(false);
  });

  it('ignores a tooltip, which never takes the keyboard', () => {
    // Arrange
    mount('<div role="tooltip" data-state="open">Merger_Agreement_v4.pdf</div>');

    // Assert
    expect(isOverlayOpen()).toBe(false);
  });
});

describe('isTextEntry', () => {
  it('is true for a text input', () => {
    // Arrange
    const root = mount('<input id="name" />');

    // Assert
    expect(isTextEntry(root.querySelector('#name'))).toBe(true);
  });

  it('is true for a textarea', () => {
    // Arrange
    const root = mount('<textarea id="notes"></textarea>');

    // Assert
    expect(isTextEntry(root.querySelector('#notes'))).toBe(true);
  });

  it('is true for something nested inside a contenteditable', () => {
    // Arrange - tag-name matching missed this
    const root = mount('<div contenteditable="true"><span id="inner">text</span></div>');

    // Assert
    expect(isTextEntry(root.querySelector('#inner'))).toBe(true);
  });

  it('is false for a button, which is what a dialog focuses', () => {
    // Arrange
    const root = mount('<button id="cancel">Cancel</button>');

    // Assert
    expect(isTextEntry(root.querySelector('#cancel'))).toBe(false);
  });

  it('is false for nothing at all', () => {
    // Assert
    expect(isTextEntry(null)).toBe(false);
  });
});
