import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runMigrate } from './helpers/migrate.js';
import { buildServer } from '../src/api/server.js';

describe('Backend API service', () => {
  const app = buildServer();

  beforeAll(async () => {
    runMigrate('up');
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes /health', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('can create and fetch a work item', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/work-items',
      payload: { title: 'API item', description: 'via api' },
    });
    expect(created.statusCode).toBe(201);
    const body = created.json() as { id: string };
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/i);

    const fetched = await app.inject({ method: 'GET', url: `/api/work-items/${body.id}` });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().title).toBe('API item');
  });

  it('can ingest an external message (contact+endpoint+thread+message)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/ingest/external-message',
      payload: {
        contactDisplayName: 'Test Sender',
        endpointType: 'telegram',
        endpointValue: '@TestSender',
        externalThreadKey: 'thread-1',
        externalMessageKey: 'msg-1',
        direction: 'inbound',
        messageBody: 'Hello',
        raw: { any: 'payload' },
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.contactId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.endpointId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.threadId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.messageId).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
