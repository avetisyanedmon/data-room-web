import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { PublicSharePage } from './PublicSharePage';
import { renderRoute } from '@/test/render';
import { stubApi } from '@/test/api-stub';

const meta = {
  resourceType: 'FOLDER' as const,
  dataRoom: { id: 'room-1', name: 'Project Phoenix', ownerName: 'Sarah Jenkins' },
  folder: { id: 'shared-1', name: 'Diligence' },
  entryFolderId: 'shared-1',
};

/** The server trims this to the shared scope, so it starts at `Diligence`. */
function publicContents(trail: { id: string; name: string; parentId: string | null }[]) {
  const current = trail[trail.length - 1];
  return {
    folder: { id: current.id, name: current.name },
    breadcrumb: trail,
    folders: [{ id: 'f-9', name: 'Schedules' }],
    files: [{ id: 'file-1', name: 'Term_Sheet.pdf', size: 2048, folderId: current.id }],
    nextCursor: null,
    access: 'VIEWER' as const,
  };
}

function renderShare(route: string, path: string) {
  return renderRoute(<PublicSharePage />, { path, route });
}

afterEach(() => vi.unstubAllGlobals());

describe('PublicSharePage', () => {
  it('shows the full trail three levels into a shared folder', async () => {
    // Arrange - the finding: a recipient this deep used to see only
    // "Top level > Ledgers" with no way to step up one level
    stubApi({
      '/contents': publicContents([
        { id: 'shared-1', name: 'Diligence', parentId: 'above' },
        { id: 'f-2', name: 'Contracts', parentId: 'shared-1' },
        { id: 'f-3', name: 'Signed', parentId: 'f-2' },
      ]),
      '/public/tok-1': meta,
    });

    // Act
    renderShare('/share/tok-1/f/f-3', '/share/:token/f/:folderId');

    // Assert - the parent is one click away, and the trail names the share
    const trail = await screen.findByRole('navigation', { name: /breadcrumb/i });
    expect(trail).toHaveTextContent('Diligence');
    expect(screen.getByRole('link', { name: 'Contracts' })).toHaveAttribute(
      'href',
      '/share/tok-1/f/f-2',
    );
    expect(screen.getByText('Signed')).toHaveAttribute('aria-current', 'page');
  });

  it('offers no link outside the shared scope', async () => {
    // Arrange
    stubApi({
      '/contents': publicContents([
        { id: 'shared-1', name: 'Diligence', parentId: 'above' },
        { id: 'f-2', name: 'Contracts', parentId: 'shared-1' },
      ]),
      '/public/tok-1': meta,
    });

    // Act
    renderShare('/share/tok-1/f/f-2', '/share/:token/f/:folderId');

    // Assert - `above` is trimmed server-side and must never be linked
    const trail = await screen.findByRole('navigation', { name: /breadcrumb/i });
    const hrefs = Array.from(trail.querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs.every((href) => href?.startsWith('/share/tok-1'))).toBe(true);
    expect(hrefs).not.toContain('/share/tok-1/f/above');
  });

  it('shows a single crumb at the top of the share', async () => {
    // Arrange
    stubApi({
      '/contents': publicContents([
        { id: 'shared-1', name: 'Diligence', parentId: 'above' },
      ]),
      '/public/tok-1': meta,
    });

    // Act
    renderShare('/share/tok-1', '/share/:token');

    // Assert - scoped to the trail, since the page heading names it too
    const trail = await screen.findByRole('navigation', { name: /breadcrumb/i });
    expect(within(trail).getByText('Diligence')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(trail).queryByRole('link')).not.toBeInTheDocument();
  });

  it('still lists the folder when the server sends no trail', async () => {
    // Arrange - defensive: the page must not go blank on an older payload
    const withoutTrail = {
      ...publicContents([{ id: 'shared-1', name: 'Diligence', parentId: null }]),
      breadcrumb: [],
    };
    stubApi({ '/contents': withoutTrail, '/public/tok-1': meta });

    // Act
    renderShare('/share/tok-1', '/share/:token');

    // Assert - the documents still list, with the folder name as a plain label
    expect(await screen.findByText('Term_Sheet.pdf')).toBeInTheDocument();
    expect(screen.getByText('Schedules')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: /breadcrumb/i }),
    ).not.toBeInTheDocument();
  });
});
