import { expect, test } from '../../src/fixtures';

test.describe('POST /api/tickets', () => {
  test('creates a ticket and returns the expected shape', async ({ api }) => {
    const response = await api.post({ title: '  Trim me  ', priority: 'high' });
    expect(response.status()).toBe(201);
    expect(await response.json()).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      title: 'Trim me',
      priority: 'high',
      status: 'open',
    });
  });

  const invalid: Array<[string, unknown, string]> = [
    ['missing title', { priority: 'low' }, 'title'],
    ['short title', { title: 'ab', priority: 'low' }, 'title'],
    ['numeric title', { title: 12345, priority: 'low' }, 'title'],
    ['unknown priority', { title: 'Valid', priority: 'urgent' }, 'priority'],
  ];
  for (const [name, body, field] of invalid) {
    test(`returns 422 for ${name}`, async ({ api }) => {
      const response = await api.post(body);
      expect(response.status()).toBe(422);
      expect((await response.json()).errors).toHaveProperty(field);
    });
  }

  test('returns 400 for malformed JSON', async ({ request, board }) => {
    const response = await request.post('/api/tickets', {
      headers: { 'x-board': board, 'content-type': 'application/json' },
      data: Buffer.from('{not json'),
    });
    expect(response.status()).toBe(400);
  });
});

test.describe('ticket lifecycle', () => {
  test('close, filter and delete', async ({ api }) => {
    const ticket = await api.seed('Lifecycle');

    expect((await api.patch(ticket.id, { status: 'closed' })).status()).toBe(200);
    expect(await (await api.list('closed')).json()).toHaveLength(1);
    expect(await (await api.list('open')).json()).toHaveLength(0);

    expect((await api.delete(ticket.id)).status()).toBe(204);
    expect((await api.delete(ticket.id)).status()).toBe(404);
  });

  test('rejects an unknown status', async ({ api }) => {
    const ticket = await api.seed('Status check');
    expect((await api.patch(ticket.id, { status: 'archived' })).status()).toBe(422);
  });

  test('boards are isolated from one another', async ({ api, request }) => {
    await api.seed('Private');
    const other = await request.get('/api/tickets', { headers: { 'x-board': 'a-different-board' } });
    const titles = (await other.json()).map((t: { title: string }) => t.title);
    expect(titles).not.toContain('Private');
  });
});
