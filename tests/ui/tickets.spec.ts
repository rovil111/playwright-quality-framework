import { expect, test } from '../../src/fixtures';

test.describe('Creating tickets', () => {
  test('a new ticket appears in the list with its priority', async ({ ticketsPage }) => {
    await ticketsPage.open();
    await ticketsPage.addTicket('Printer offline', 'High');
    await expect(ticketsPage.row('Printer offline')).toContainText('high');
    await expect(ticketsPage.title).toBeEmpty();
  });

  for (const invalid of ['', '  ', 'ab']) {
    test(`title "${invalid}" is rejected with a visible error`, async ({ ticketsPage }) => {
      await ticketsPage.open();
      await ticketsPage.addTicket(invalid);
      await expect(ticketsPage.titleError).toHaveText('Title must be at least 3 characters.');
      await expect(ticketsPage.rows).toHaveCount(0);
    });
  }

  test('the error clears after a valid submission', async ({ ticketsPage }) => {
    await ticketsPage.open();
    await ticketsPage.addTicket('ab');
    await expect(ticketsPage.titleError).not.toBeEmpty();
    await ticketsPage.addTicket('Valid title');
    await expect(ticketsPage.titleError).toBeEmpty();
    await expect(ticketsPage.rows).toHaveCount(1);
  });

  test('ticket titles render as text, not HTML', async ({ ticketsPage, page }) => {
    await ticketsPage.open();
    await ticketsPage.addTicket('<img src=x onerror=alert(1)>');
    await expect(ticketsPage.rows).toHaveCount(1);
    await expect(page.locator('#tickets img')).toHaveCount(0);
  });
});

test.describe('Managing tickets (state seeded through the API)', () => {
  test('filters separate open and closed tickets', async ({ api, ticketsPage }) => {
    await api.seed('Stays open');
    await api.seed('Gets closed');
    await ticketsPage.open();
    await ticketsPage.close('Gets closed');

    await ticketsPage.filter.selectOption({ label: 'Open' });
    await expect(ticketsPage.rows).toHaveCount(1);
    await expect(ticketsPage.row('Stays open')).toBeVisible();

    await ticketsPage.filter.selectOption({ label: 'Closed' });
    await expect(ticketsPage.rows).toHaveCount(1);
    await expect(ticketsPage.row('Gets closed')).toBeVisible();
  });

  test('deleting the last ticket shows the empty state', async ({ api, ticketsPage }) => {
    await api.seed('Delete me');
    await ticketsPage.open();
    await expect(ticketsPage.emptyMessage).toBeHidden();
    await ticketsPage.delete('Delete me');
    await expect(ticketsPage.emptyMessage).toBeVisible();
  });

  test('closed state survives a page reload', async ({ api, ticketsPage, page }) => {
    await api.seed('Persistent');
    await ticketsPage.open();
    await ticketsPage.close('Persistent');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Reopen Persistent' })).toBeVisible();
  });
});

test.describe('Resilience', () => {
  test('the UI renders a mocked server list without touching the backend', async ({ page, ticketsPage }) => {
    await page.route('**/api/tickets', (route) =>
      route.fulfill({ json: [{ id: 'mock-1', title: 'Mocked ticket', priority: 'low', status: 'open' }] }),
    );
    await ticketsPage.open();
    await expect(ticketsPage.row('Mocked ticket')).toBeVisible();
  });
});
