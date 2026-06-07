import { getProfile, updateProfile } from '../mcp/mongoMCP.js';

export const get = async (req, res) => {
  const userId = req.headers['x-user-id'] || 'default';
  const result = await getProfile(userId);
  res.json(result);
};

export const update = async (req, res) => {
  const userId = req.headers['x-user-id'] || 'default';
  const result = await updateProfile(userId, req.body);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
};
