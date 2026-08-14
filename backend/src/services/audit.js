import { v4 as uuid } from 'uuid';

// Writes an audit_log row using the SAME connection/transaction as the
// primary write, so a failed audit insert rolls back the whole action —
// it should be impossible for a milestone to change state without a
// corresponding audit record.
export async function writeAudit(connection, { projectId, eventType, actorId, detail }) {
  const id = uuid();
  await connection.query(
    'INSERT INTO audit_log (id, project_id, event_type, actor_id, detail) VALUES (?, ?, ?, ?, ?)',
    [id, projectId, eventType, actorId, JSON.stringify(detail)]
  );
  return id;
}
