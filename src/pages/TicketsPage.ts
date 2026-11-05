import { expect, type Locator, type Page } from '@playwright/test';

export type Priority = 'Low' | 'Medium' | 'High';

/** Page object: tests describe intent, and locators live only here. */
export class TicketsPage {
  readonly title: Locator;
  readonly priority: Locator;
  readonly addButton: Locator;
  readonly titleError: Locator;
  readonly filter: Locator;
  readonly rows: Locator;
  readonly emptyMessage: Locator;

  constructor(private readonly page: Page, private readonly board: string) {
    this.title = page.getByLabel('Title');
    this.priority = page.getByLabel('Priority');
    this.addButton = page.getByRole('button', { name: 'Add ticket' });
    this.titleError = page.getByRole('alert');
    this.filter = page.getByLabel('Show');
    this.rows = page.getByRole('list', { name: 'Tickets' }).getByRole('listitem');
    this.emptyMessage = page.getByText('No tickets to show.');
  }

  async open(): Promise<void> {
    const loaded = this.page.waitForResponse((r) => r.url().includes('/api/tickets'));
    await this.page.goto(`/?board=${this.board}`);
    await loaded;
  }

  async addTicket(title: string, priority: Priority = 'Medium'): Promise<void> {
    await this.title.fill(title);
    await this.priority.selectOption({ label: priority });
    await this.addButton.click();
  }

  row(title: string): Locator {
    return this.rows.filter({ hasText: title });
  }

  async close(title: string): Promise<void> {
    await this.page.getByRole('button', { name: `Close ${title}` }).click();
    await expect(this.page.getByRole('button', { name: `Reopen ${title}` })).toBeVisible();
  }

  async delete(title: string): Promise<void> {
    await this.page.getByRole('button', { name: `Delete ${title}` }).click();
  }
}
