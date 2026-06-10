import mcpClient from '../mcp/mcpClient.js';

export const get = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'default';
    const result = await mcpClient.callTool('get_profile', { userId });
    res.json({ success: true, data: result.profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'default';
    const result = await mcpClient.callTool('update_profile', { userId, updates: req.body });
    res.json({ success: true, data: result.profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
