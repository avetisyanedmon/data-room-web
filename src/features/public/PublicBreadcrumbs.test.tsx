import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { BreadcrumbDto } from '@/api/data-room-api-ts/types';
import { PublicBreadcrumbs } from './PublicBreadcrumbs';

function crumb(id: string, name: string, parentId: string | null): BreadcrumbDto {
  return { id, name, parentId };
}

function renderTrail(items: BreadcrumbDto[]) {
  return render(
    <MemoryRouter>
      <PublicBreadcrumbs token="tok-1" items={items} />
    </MemoryRouter>,
  );
}

describe('PublicBreadcrumbs', () => {
  it('marks the shared root as the current page when it is the one open', () => {
    // Arrange - the server trims the trail to the shared scope, so the first
    // entry is the top level the recipient can reach
    renderTrail([crumb('shared-1', 'Diligence', 'f-parent')]);

    // Assert
    expect(screen.getByText('Diligence')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links the shared root back to the bare share URL', () => {
    // Arrange - /share/:token is the entry point; the root has no folder route
    renderTrail([
      crumb('shared-1', 'Diligence', 'f-parent'),
      crumb('f-2', 'Contracts', 'shared-1'),
    ]);

    // Assert
    expect(screen.getByRole('link', { name: 'Diligence' })).toHaveAttribute(
      'href',
      '/share/tok-1',
    );
  });

  it('links intermediate folders into the share', () => {
    // Arrange
    renderTrail([
      crumb('shared-1', 'Diligence', 'f-parent'),
      crumb('f-2', 'Contracts', 'shared-1'),
      crumb('f-3', 'Signed', 'f-2'),
    ]);

    // Assert
    expect(screen.getByRole('link', { name: 'Contracts' })).toHaveAttribute(
      'href',
      '/share/tok-1/f/f-2',
    );
    expect(screen.getByText('Signed')).toHaveAttribute('aria-current', 'page');
  });

  it('lets a recipient step up one level rather than only jumping to the top', () => {
    // Arrange - the whole point of the finding: three levels deep, the parent
    // must be reachable without losing your place
    renderTrail([
      crumb('shared-1', 'Diligence', 'f-parent'),
      crumb('f-2', 'Contracts', 'shared-1'),
      crumb('f-3', 'Signed', 'f-2'),
    ]);

    // Assert
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/share/tok-1', '/share/tok-1/f/f-2']);
  });

  it('never offers a link outside the shared scope', () => {
    // Arrange - `shared-1` has a parent, but it is above the share and the
    // server has already trimmed it away
    renderTrail([
      crumb('shared-1', 'Diligence', 'f-parent'),
      crumb('f-2', 'Contracts', 'shared-1'),
    ]);

    // Assert
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs.every((href) => href?.startsWith('/share/tok-1'))).toBe(true);
    expect(hrefs).not.toContain('/share/tok-1/f/f-parent');
  });

  it('folds a deep path into a menu', async () => {
    // Arrange
    renderTrail([
      crumb('shared-1', 'Diligence', 'f-parent'),
      crumb('f-2', 'One', 'shared-1'),
      crumb('f-3', 'Two', 'f-2'),
      crumb('f-4', 'Three', 'f-3'),
      crumb('f-5', 'Four', 'f-4'),
    ]);

    // Assert - the middle is reachable, just not inline
    expect(screen.queryByText('One')).not.toBeInTheDocument();
    expect(screen.getByText('Four')).toHaveAttribute('aria-current', 'page');

    await userEvent.click(screen.getByRole('button', { name: /show hidden folders/i }));
    expect(await screen.findByRole('menuitem', { name: 'One' })).toBeInTheDocument();
  });

  it('renders nothing when the server sent no trail', () => {
    // Arrange - older payloads, or a share whose scope resolved to nothing
    const { container } = renderTrail([]);

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it('is labelled for assistive technology', () => {
    // Arrange
    renderTrail([crumb('shared-1', 'Diligence', 'f-parent')]);

    // Assert
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });
});
