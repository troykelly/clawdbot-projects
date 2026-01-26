import Fastify, { type FastifyInstance } from 'fastify';
import { createPool } from '../db.js';

export type ProjectsApiOptions = {
  logger?: boolean;
};

export function buildServer(options: ProjectsApiOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });

  app.get('/health', async () => ({ ok: true }));

  app.post('/api/work-items', async (req, reply) => {
    const body = req.body as { title?: string; description?: string | null };
    if (!body?.title || body.title.trim().length === 0) {
      return reply.code(400).send({ error: 'title is required' });
    }

    const pool = createPool();
    const result = await pool.query(
      `INSERT INTO work_item (title, description)
       VALUES ($1, $2)
       RETURNING id::text as id, title, description, status, priority::text as priority, task_type::text as task_type`,
      [body.title.trim(), body.description ?? null]
    );
    await pool.end();

    return reply.code(201).send(result.rows[0]);
  });

  app.get('/api/work-items/:id', async (req, reply) => {
    const params = req.params as { id: string };
    const pool = createPool();
    const result = await pool.query(
      `SELECT id::text as id, title, description, status, priority::text as priority, task_type::text as task_type,
              created_at, updated_at, not_before, not_after
         FROM work_item
        WHERE id = $1`,
      [params.id]
    );
    await pool.end();

    if (result.rows.length === 0) return reply.code(404).send({ error: 'not found' });
    return reply.send(result.rows[0]);
  });

  app.post('/api/work-items/:id/dependencies', async (req, reply) => {
    const params = req.params as { id: string };
    const body = req.body as { dependsOnWorkItemId?: string; kind?: string };
    if (!body?.dependsOnWorkItemId) {
      return reply.code(400).send({ error: 'dependsOnWorkItemId is required' });
    }

    const pool = createPool();
    const result = await pool.query(
      `INSERT INTO work_item_dependency (work_item_id, depends_on_work_item_id, kind)
       VALUES ($1, $2, $3)
       RETURNING id::text as id, work_item_id::text as work_item_id, depends_on_work_item_id::text as depends_on_work_item_id, kind`,
      [params.id, body.dependsOnWorkItemId, body.kind ?? 'depends_on']
    );
    await pool.end();

    return reply.code(201).send(result.rows[0]);
  });

  app.post('/api/contacts', async (req, reply) => {
    const body = req.body as { displayName?: string; notes?: string | null };
    if (!body?.displayName || body.displayName.trim().length === 0) {
      return reply.code(400).send({ error: 'displayName is required' });
    }

    const pool = createPool();
    const result = await pool.query(
      `INSERT INTO contact (display_name, notes)
       VALUES ($1, $2)
       RETURNING id::text as id, display_name, notes, created_at, updated_at`,
      [body.displayName.trim(), body.notes ?? null]
    );
    await pool.end();

    return reply.code(201).send(result.rows[0]);
  });

  app.post('/api/contacts/:id/endpoints', async (req, reply) => {
    const params = req.params as { id: string };
    const body = req.body as {
      endpointType?: string;
      endpointValue?: string;
      metadata?: unknown;
    };

    if (!body?.endpointType || !body?.endpointValue) {
      return reply.code(400).send({ error: 'endpointType and endpointValue are required' });
    }

    const pool = createPool();

    const inserted = await pool.query(
      `INSERT INTO contact_endpoint (contact_id, endpoint_type, endpoint_value, metadata)
       VALUES ($1, $2::contact_endpoint_type, $3, COALESCE($4::jsonb, '{}'::jsonb))
       RETURNING id::text as id, contact_id::text as contact_id, endpoint_type::text as endpoint_type,
                 endpoint_value, normalized_value, metadata`,
      [params.id, body.endpointType, body.endpointValue, body.metadata ? JSON.stringify(body.metadata) : null]
    );

    await pool.end();
    return reply.code(201).send(inserted.rows[0]);
  });

  // Ingestion: create (or reuse) contact+endpoint, create (or reuse) thread, insert message.
  app.post('/api/ingest/external-message', async (req, reply) => {
    const body = req.body as {
      contactDisplayName?: string;
      endpointType?: string;
      endpointValue?: string;
      externalThreadKey?: string;
      externalMessageKey?: string;
      direction?: 'inbound' | 'outbound';
      messageBody?: string | null;
      raw?: unknown;
      receivedAt?: string;
    };

    if (!body?.endpointType || !body?.endpointValue) {
      return reply.code(400).send({ error: 'endpointType and endpointValue are required' });
    }

    if (!body?.externalThreadKey || !body?.externalMessageKey || !body?.direction) {
      return reply
        .code(400)
        .send({ error: 'externalThreadKey, externalMessageKey, and direction are required' });
    }

    const pool = createPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const displayName = (body.contactDisplayName || 'Unknown').trim();

      // Try to find an existing endpoint (unique on (endpoint_type, normalized_value))
      const existingEndpoint = await client.query(
        `SELECT ce.id::text as id, ce.contact_id::text as contact_id
           FROM contact_endpoint ce
          WHERE ce.endpoint_type = $1::contact_endpoint_type
            AND ce.normalized_value = normalize_contact_endpoint_value($1::contact_endpoint_type, $2)
          LIMIT 1`,
        [body.endpointType, body.endpointValue]
      );

      let contactId: string;
      let endpointId: string;

      if (existingEndpoint.rows.length > 0) {
        endpointId = existingEndpoint.rows[0].id;
        contactId = existingEndpoint.rows[0].contact_id;
      } else {
        const contact = await client.query(
          `INSERT INTO contact (display_name)
           VALUES ($1)
           RETURNING id::text as id`,
          [displayName.length > 0 ? displayName : 'Unknown']
        );
        contactId = contact.rows[0].id;

        const endpoint = await client.query(
          `INSERT INTO contact_endpoint (contact_id, endpoint_type, endpoint_value)
           VALUES ($1, $2::contact_endpoint_type, $3)
           RETURNING id::text as id`,
          [contactId, body.endpointType, body.endpointValue]
        );
        endpointId = endpoint.rows[0].id;
      }

      const thread = await client.query(
        `INSERT INTO external_thread (endpoint_id, channel, external_thread_key)
         VALUES ($1, $2::contact_endpoint_type, $3)
         ON CONFLICT (channel, external_thread_key)
         DO UPDATE SET endpoint_id = EXCLUDED.endpoint_id, updated_at = now()
         RETURNING id::text as id`,
        [endpointId, body.endpointType, body.externalThreadKey]
      );
      const threadId = thread.rows[0].id as string;

      const message = await client.query(
        `INSERT INTO external_message (thread_id, external_message_key, direction, body, raw, received_at)
         VALUES ($1, $2, $3::message_direction, $4, COALESCE($5::jsonb, '{}'::jsonb), COALESCE($6::timestamptz, now()))
         ON CONFLICT (thread_id, external_message_key)
         DO UPDATE SET body = EXCLUDED.body
         RETURNING id::text as id`,
        [
          threadId,
          body.externalMessageKey,
          body.direction,
          body.messageBody ?? null,
          body.raw ? JSON.stringify(body.raw) : null,
          body.receivedAt ?? null,
        ]
      );
      const messageId = message.rows[0].id as string;

      await client.query('COMMIT');
      return reply.code(201).send({
        contactId,
        endpointId,
        threadId,
        messageId,
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
      await pool.end();
    }
  });

  return app;
}
