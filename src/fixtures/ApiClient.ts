import { expect, type APIRequestContext } from '@playwright/test';

export interface Ticket {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'closed';
}

/** Thin API wrapper used to seed state quickly, and as the subject of the API tests. */
export class ApiClient {
  constructor(private readonly request: APIRequestContext, private readonly board: string) {}

  private get headers() {
    return { 'x-board': this.board };
  }

  post(data: unknown) {
    return this.request.post('/api/tickets', { headers: this.headers, data });
  }

  list(status?: string) {
    return this.request.get('/api/tickets', { headers: this.headers, params: status ? { status } : {} });
  }

  patch(id: string, data: unknown) {
    return this.request.patch(`/api/tickets/${id}`, { headers: this.headers, data });
  }

  delete(id: string) {
    return this.request.delete(`/api/tickets/${id}`, { headers: this.headers });
  }

  async seed(title: string, priority: Ticket['priority'] = 'medium'): Promise<Ticket> {
    const response = await this.post({ title, priority });
    expect(response.status(), 'seeding a ticket').toBe(201);
    return response.json();
  }
}
