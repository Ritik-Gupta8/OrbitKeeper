import {
  createApplication,
  updateApplication,
  getApplication,
  listApplications,
  deleteApplication,
  getDashboardStats,
  searchApplications,
} from '../mcp/mongoMCP.js';

export const getAll = async (req, res) => {
  const { status, search } = req.query;
  const userId = req.headers['x-user-id'] || 'default';

  if (search) {
    const result = await searchApplications(search);
    return res.json(result);
  }

  const filters = { userId };
  if (status) filters.status = status;

  const result = await listApplications(filters);
  res.json(result);
};

export const getOne = async (req, res) => {
  const result = await getApplication(req.params.id);
  if (!result.success) return res.status(404).json(result);
  res.json(result);
};

export const create = async (req, res) => {
  const userId = req.headers['x-user-id'] || 'default';
  const result = await createApplication({ ...req.body, userId });
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
};

export const update = async (req, res) => {
  const result = await updateApplication(req.params.id, req.body);
  if (!result.success) return res.status(404).json(result);
  res.json(result);
};

export const remove = async (req, res) => {
  const result = await deleteApplication(req.params.id);
  if (!result.success) return res.status(404).json(result);
  res.json(result);
};

export const stats = async (req, res) => {
  const userId = req.headers['x-user-id'] || 'default';
  const result = await getDashboardStats(userId);
  res.json(result);
};
