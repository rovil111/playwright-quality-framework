import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../../src/fixtures';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test('empty state has no WCAG A/AA violations', async ({ page, ticketsPage }) => {
  await ticketsPage.open();
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations).toEqual([]);
});

test('populated list with a validation error has no violations', async ({ api, page, ticketsPage }) => {
  await api.seed('Accessible ticket');
  await ticketsPage.open();
  await ticketsPage.addTicket('ab');
  await expect(ticketsPage.titleError).not.toBeEmpty();
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations).toEqual([]);
});

test('the form can be completed with the keyboard alone', async ({ page, ticketsPage }) => {
  await ticketsPage.open();
  await ticketsPage.title.focus();
  await page.keyboard.type('Keyboard ticket');
  await page.keyboard.press('Enter');
  await expect(ticketsPage.row('Keyboard ticket')).toBeVisible();
});
