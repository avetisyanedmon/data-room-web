import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BreadcrumbDto } from '@/api/data-room-api-ts/types';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { Breadcrumbs } from './Breadcrumbs';

function crumb(id: string, name: string, parentId: string | null): BreadcrumbDto {
  return { id, name, parentId };
}

function renderTrail(items: BreadcrumbDto[]) {
  return render(
    <TooltipProvider>
      <MemoryRouter>
        <Breadcrumbs roomId="room-1" items={items} roomName="Project Phoenix" />
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe('Breadcrumbs', () => {
  describe('for the owner, whose trail starts at the room root', () => {
    it('shows the room as home and links it to the room', () => {
      // Arrange - the root folder shares the room's name
      renderTrail([crumb('root-1', 'Project Phoenix', null)]);

      // Assert
      expect(screen.getByRole('link', { name: /project phoenix/i })).toHaveAttribute(
        'href',
        '/rooms/room-1',
      );
    });

    it('marks the deepest folder as the current page', () => {
      // Arrange
      renderTrail([
        crumb('root-1', 'Project Phoenix', null),
        crumb('f-1', 'Statements', 'root-1'),
        crumb('f-2', 'Q3', 'f-1'),
      ]);

      // Assert
      expect(screen.getByText('Q3')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Statements' })).toHaveAttribute(
        'href',
        '/rooms/room-1/f/f-1',
      );
    });
  });

  describe('for a recipient, whose trail is trimmed to the folder they hold', () => {
    it('names the shared folder rather than the room', () => {
      // Arrange - the server trims ancestors above the share; the room root is
      // deliberately absent, and the recipient cannot open it.
      renderTrail([crumb('shared-1', 'Q3 Financials', 'f-parent')]);

      // Assert
      expect(screen.getByText('Q3 Financials')).toBeInTheDocument();
      expect(screen.queryByText('Project Phoenix')).not.toBeInTheDocument();
    });

    it('offers no link to the room root', () => {
      // Arrange
      renderTrail([
        crumb('shared-1', 'Q3 Financials', 'f-parent'),
        crumb('f-9', 'Statements', 'shared-1'),
      ]);

      // Assert - every link must stay inside the shared subtree
      const hrefs = screen
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'));
      expect(hrefs).not.toContain('/rooms/room-1');
      expect(hrefs).toContain('/rooms/room-1/f/shared-1');
    });

    it('marks the shared folder as the current page when it is the one open', () => {
      // Arrange
      renderTrail([crumb('shared-1', 'Q3 Financials', 'f-parent')]);

      // Assert
      expect(screen.getByText('Q3 Financials')).toHaveAttribute('aria-current', 'page');
    });

    it('keeps the shared folder visible as the trail deepens', () => {
      // Arrange
      renderTrail([
        crumb('shared-1', 'Q3 Financials', 'f-parent'),
        crumb('f-2', 'Ledgers', 'shared-1'),
        crumb('f-3', 'August', 'f-2'),
      ]);

      // Assert
      expect(screen.getByRole('link', { name: 'Q3 Financials' })).toBeInTheDocument();
      expect(screen.getByText('August')).toHaveAttribute('aria-current', 'page');
    });
  });

  it('collapses the middle of a deep path into a menu', () => {
    // Arrange - root plus four descendants is past the visible tail
    renderTrail([
      crumb('root-1', 'Project Phoenix', null),
      crumb('f-1', 'One', 'root-1'),
      crumb('f-2', 'Two', 'f-1'),
      crumb('f-3', 'Three', 'f-2'),
      crumb('f-4', 'Four', 'f-3'),
    ]);

    // Assert
    expect(screen.getByRole('button', { name: /show hidden folders/i })).toBeInTheDocument();
    expect(screen.queryByText('One')).not.toBeInTheDocument();
    expect(screen.getByText('Four')).toHaveAttribute('aria-current', 'page');
  });

  it('renders nothing but the room when the trail is empty', () => {
    // Arrange - defensive: an empty breadcrumb should not throw
    renderTrail([]);

    // Assert
    expect(screen.getByRole('link', { name: /project phoenix/i })).toBeInTheDocument();
  });
});
