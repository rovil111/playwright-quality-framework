import { randomUUID } from 'node:crypto';
import { test as base } from '@playwright/test';
import { TicketsPage } from '../pages/TicketsPage';
import { ApiClient } from './ApiClient';

interface Fixtures {
  /** A unique board per test, which keeps parallel tests isolated. */
  board: string;
  api: ApiClient;
  ticketsPage: TicketsPage;
}

export const test = base.extend<Fixtures>({
  board: async ({}, use) => {
    await use(randomUUID());
  },
  api: async ({ request, board }, use) => {
    await use(new ApiClient(request, board));
  },
  ticketsPage: async ({ page, board }, use) => {
    await use(new TicketsPage(page, board));
  },
});

export { expect } from '@playwright/test';
