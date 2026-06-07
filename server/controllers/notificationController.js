import { listNotificationLogs } from '../mcp/mongoMCP.js';

export const getLogs = async (req, res) => {
  const result = await listNotificationLogs({});
  res.json(result);
};
