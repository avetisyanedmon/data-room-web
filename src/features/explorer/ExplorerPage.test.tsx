import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExplorerPage } from './ExplorerPage';
import { renderRoute } from '@/test/render';
import { contents, room, stubApi } from '@/test/api-stub';

function renderExplorer() {
  return renderRoute(<ExplorerPage />, { path: '/rooms/:roomId', route: '/rooms/room-1' });
}

afterEach(() => vi.unstubAllGlobals());

describe('ExplorerPage', () => {
  it('lists the folders and files in the current folder', async () => {
    stubApi({ '/contents': contents('OWNER'), '/data-rooms/room-1': room });
    renderExplorer();

    expect(await screen.findByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Merger_Agreement_v4.pdf')).toBeInTheDocument();
    // Sizes scale past MB, and folder totals come from the subtree counters.
    expect(screen.getByText('4.2 MB')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
  });

  it('offers upload and folder creation to the owner', async () => {
    stubApi({ '/contents': contents('OWNER'), '/data-rooms/room-1': room });
    renderExplorer();

    expect(await screen.findByRole('button', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new folder/i })).toBeInTheDocument();
    expect(screen.queryByText(/read-only access/i)).not.toBeInTheDocument();
  });

  it('hides every mutating control from a viewer', async () => {
    stubApi({
      '/contents': contents('VIEWER'),
      '/data-rooms/room-1': { ...room, access: 'VIEWER' },
    });
    renderExplorer();

    expect(await screen.findByText(/read-only access/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^upload$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new folder/i })).not.toBeInTheDocument();
    // Folder rows expose no action menu at all without write access.
    expect(screen.queryByRole('button', { name: /actions for legal/i })).not.toBeInTheDocument();
  });

  it('sends someone to the wrong-account screen on a 403', async () => {
    // 403 = the room exists but was never shared with this account.
    stubApi({ '/data-rooms/room-1': () => undefined, '__never__': undefined });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'You do not have access', statusCode: 403 }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
    renderExplorer();

    expect(await screen.findByText(/isn't shared with your account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch account/i })).toBeInTheDocument();
  });

  it('explains a folder that was deleted while it was open', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('/contents')) {
          return new Response(JSON.stringify({ message: 'Folder not found', statusCode: 404 }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ data: room }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );
    renderExplorer();

    await waitFor(() =>
      expect(screen.getByText(/no longer available/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /back to room root/i })).toBeInTheDocument();
  });

  it('shows an empty state with both ways to start', async () => {
    stubApi({
      '/contents': { ...contents('OWNER'), folders: [], files: [] },
      '/data-rooms/room-1': room,
    });
    renderExplorer();

    expect(await screen.findByText(/this data room is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload files/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create folder/i })).toBeInTheDocument();
  });

  describe('keyboard shortcuts', () => {
    it('opens the active row on Enter', async () => {
      stubApi({ '/contents': contents('OWNER'), '/data-rooms/room-1': room });
      renderExplorer();
      const row = await screen.findByText('Merger_Agreement_v4.pdf');

      // Arrange - selecting a row is what arming Enter looks like
      await userEvent.click(row);

      // Act / Assert - the explorer navigates away, so its list is gone
      await userEvent.keyboard('{Enter}');
      await waitFor(() =>
        expect(screen.queryByText('Merger_Agreement_v4.pdf')).not.toBeInTheDocument(),
      );
    });

    it('does not act on Enter while a confirmation is open', async () => {
      stubApi({ '/contents': contents('OWNER'), '/data-rooms/room-1': room });
      renderExplorer();
      const menu = await screen.findByRole('button', {
        name: /actions for merger_agreement_v4/i,
      });

      // Arrange - opening the confirmation from the row's menu also marks the
      // row active, which is what arms the list's own Enter handler
      await userEvent.click(menu);
      await userEvent.click(await screen.findByRole('menuitem', { name: /delete/i }));
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveTextContent('Delete "Merger_Agreement_v4.pdf"?');

      // Act
      await userEvent.keyboard('{Enter}');

      // Assert - the explorer list is still mounted. The previous handler
      // called preventDefault and navigated to the document, which both
      // swallowed the focused button's activation and left the confirmation
      // unanswered. Rows are counted through the DOM because Radix marks the
      // page behind a modal aria-hidden, which role queries skip.
      expect(document.querySelectorAll('[data-row-id]')).toHaveLength(2);
    });

    it('does not act on Enter while the rename dialog is open', async () => {
      stubApi({ '/contents': contents('OWNER'), '/data-rooms/room-1': room });
      renderExplorer();
      await userEvent.click(
        await screen.findByRole('button', { name: /actions for merger_agreement_v4/i }),
      );
      await userEvent.click(await screen.findByRole('menuitem', { name: /rename/i }));
      await screen.findByRole('dialog');

      // Act - Enter submits the rename form, not the row underneath
      await userEvent.keyboard('{Enter}');

      // Assert
      expect(document.querySelectorAll('[data-row-id]')).toHaveLength(2);
    });

    it('does not open the search palette on top of a dialog', async () => {
      stubApi({ '/contents': contents('OWNER'), '/data-rooms/room-1': room });
      renderExplorer();
      await userEvent.click(
        await screen.findByRole('button', { name: /actions for merger_agreement_v4/i }),
      );
      await userEvent.click(await screen.findByRole('menuitem', { name: /rename/i }));
      await screen.findByRole('dialog');

      // Act
      await userEvent.keyboard('{Meta>}k{/Meta}');

      // Assert - one dialog, still the rename one
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      expect(
        screen.queryByPlaceholderText(/search folders and documents/i),
      ).not.toBeInTheDocument();
    });
  });
});
