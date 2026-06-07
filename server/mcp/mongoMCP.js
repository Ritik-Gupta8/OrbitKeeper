/**
 * MongoDB MCP Integration Layer
 * 
 * This module provides MCP-style tool wrappers around MongoDB operations.
 * Each function represents an MCP tool that the AI agents can invoke.
 * 
 * MCP Tool Pattern:
 *   - tool_name: descriptive snake_case name
 *   - input: structured parameters
 *   - output: structured result with success/error
 */

import Application from '../models/Application.js';
import NotificationLog from '../models/NotificationLog.js';
import Profile from '../models/Profile.js';

// ─────────────────────────────────────────────
// APPLICATION TOOLS
// ─────────────────────────────────────────────

/**
 * MCP Tool: create_application
 * Creates a new application record in MongoDB
 */
export const createApplication = async (data) => {
  try {
    const app = new Application(data);
    await app.save();
    return { success: true, tool: 'create_application', data: app.toObject() };
  } catch (err) {
    return { success: false, tool: 'create_application', error: err.message };
  }
};

/**
 * MCP Tool: update_application
 * Updates an existing application by ID
 */
export const updateApplication = async (id, updates) => {
  try {
    const app = await Application.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!app) return { success: false, tool: 'update_application', error: 'Application not found' };
    return { success: true, tool: 'update_application', data: app.toObject() };
  } catch (err) {
    return { success: false, tool: 'update_application', error: err.message };
  }
};

/**
 * MCP Tool: get_application
 * Retrieves a single application by ID
 */
export const getApplication = async (id) => {
  try {
    const app = await Application.findById(id);
    if (!app) return { success: false, tool: 'get_application', error: 'Application not found' };
    return { success: true, tool: 'get_application', data: app.toObject() };
  } catch (err) {
    return { success: false, tool: 'get_application', error: err.message };
  }
};

/**
 * MCP Tool: list_applications
 * Retrieves all applications with optional filters
 */
export const listApplications = async (filters = {}, options = {}) => {
  try {
    const { sort = { createdAt: -1 }, limit = 100 } = options;
    const apps = await Application.find(filters).sort(sort).limit(limit);
    return { success: true, tool: 'list_applications', data: apps.map(a => a.toObject()), count: apps.length };
  } catch (err) {
    return { success: false, tool: 'list_applications', error: err.message };
  }
};

/**
 * MCP Tool: delete_application
 * Deletes an application by ID
 */
export const deleteApplication = async (id) => {
  try {
    await Application.findByIdAndDelete(id);
    return { success: true, tool: 'delete_application', data: { id } };
  } catch (err) {
    return { success: false, tool: 'delete_application', error: err.message };
  }
};

/**
 * MCP Tool: store_ai_analysis
 * Stores the full AI analysis results for an application
 */
export const storeAIAnalysis = async (id, analysis) => {
  try {
    const updates = {
      jobSummary: analysis.jobSummary || {},
      matchScore: analysis.matchScore || 0,
      strengthAreas: analysis.strengthAreas || [],
      weaknessAreas: analysis.weaknessAreas || [],
      missingSkills: analysis.missingSkills || [],
      improvementSuggestions: analysis.improvementSuggestions || [],
      actionPlan: analysis.actionPlan || [],
      interviewQuestions: analysis.interviewQuestions || {},
    };
    const app = await Application.findByIdAndUpdate(id, updates, { new: true });
    if (!app) return { success: false, tool: 'store_ai_analysis', error: 'Application not found' };
    return { success: true, tool: 'store_ai_analysis', data: app.toObject() };
  } catch (err) {
    return { success: false, tool: 'store_ai_analysis', error: err.message };
  }
};

/**
 * MCP Tool: get_upcoming_deadlines
 * Finds applications with upcoming deadlines for the monitoring agent
 */
export const getUpcomingDeadlines = async (hoursAhead = 25) => {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const apps = await Application.find({
      deadline: { $gte: now, $lte: future },
      status: { $nin: ['rejected', 'withdrawn', 'offer'] },
    });

    return { success: true, tool: 'get_upcoming_deadlines', data: apps.map(a => a.toObject()), count: apps.length };
  } catch (err) {
    return { success: false, tool: 'get_upcoming_deadlines', error: err.message };
  }
};

/**
 * MCP Tool: mark_reminder_sent
 * Marks a reminder as sent to prevent duplicate notifications
 */
export const markReminderSent = async (id, type) => {
  try {
    const field = type === '24h' ? { reminder24hSent: true } : { reminder12hSent: true };
    const app = await Application.findByIdAndUpdate(id, field, { new: true });
    return { success: true, tool: 'mark_reminder_sent', data: app.toObject() };
  } catch (err) {
    return { success: false, tool: 'mark_reminder_sent', error: err.message };
  }
};

/**
 * MCP Tool: search_applications
 * Semantic/text search across applications
 */
export const searchApplications = async (query) => {
  try {
    const regex = new RegExp(query, 'i');
    const apps = await Application.find({
      $or: [
        { company: regex },
        { role: regex },
        { notes: regex },
        { jobDescription: regex },
      ],
    }).limit(20);
    return { success: true, tool: 'search_applications', data: apps.map(a => a.toObject()), count: apps.length };
  } catch (err) {
    return { success: false, tool: 'search_applications', error: err.message };
  }
};

// ─────────────────────────────────────────────
// NOTIFICATION LOG TOOLS
// ─────────────────────────────────────────────

/**
 * MCP Tool: log_notification
 * Logs a sent notification to the notification_logs collection
 */
export const logNotification = async (data) => {
  try {
    const log = new NotificationLog(data);
    await log.save();
    return { success: true, tool: 'log_notification', data: log.toObject() };
  } catch (err) {
    return { success: false, tool: 'log_notification', error: err.message };
  }
};

/**
 * MCP Tool: list_notification_logs
 * Retrieves notification history
 */
export const listNotificationLogs = async (filters = {}) => {
  try {
    const logs = await NotificationLog.find(filters).sort({ sentAt: -1 }).limit(50);
    return { success: true, tool: 'list_notification_logs', data: logs.map(l => l.toObject()), count: logs.length };
  } catch (err) {
    return { success: false, tool: 'list_notification_logs', error: err.message };
  }
};

// ─────────────────────────────────────────────
// PROFILE TOOLS
// ─────────────────────────────────────────────

/**
 * MCP Tool: get_profile
 * Retrieves the user's career profile
 */
export const getProfile = async (userId = 'default') => {
  try {
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
      await profile.save();
    }
    return { success: true, tool: 'get_profile', data: profile.toObject() };
  } catch (err) {
    return { success: false, tool: 'get_profile', error: err.message };
  }
};

/**
 * MCP Tool: update_profile
 * Updates the user's career profile
 */
export const updateProfile = async (userId = 'default', updates) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { ...updates, userId },
      { new: true, upsert: true, runValidators: true }
    );
    return { success: true, tool: 'update_profile', data: profile.toObject() };
  } catch (err) {
    return { success: false, tool: 'update_profile', error: err.message };
  }
};

/**
 * MCP Tool: get_dashboard_stats
 * Aggregates dashboard statistics
 */
export const getDashboardStats = async (userId = 'default') => {
  try {
    const pipeline = [
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgMatchScore: { $avg: '$matchScore' },
        },
      },
    ];

    const byStatus = await Application.aggregate(pipeline);
    const total = await Application.countDocuments({ userId });
    const recent = await Application.find({ userId }).sort({ createdAt: -1 }).limit(5).select('company role status matchScore createdAt');
    const upcomingDeadlines = await Application.find({
      userId,
      deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      status: { $nin: ['rejected', 'withdrawn'] },
    }).sort({ deadline: 1 }).limit(5);

    const stats = {
      total,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      avgMatchScore: Math.round(byStatus.reduce((sum, s) => sum + (s.avgMatchScore || 0), 0) / (byStatus.length || 1)),
      recentApplications: recent,
      upcomingDeadlines,
    };

    return { success: true, tool: 'get_dashboard_stats', data: stats };
  } catch (err) {
    return { success: false, tool: 'get_dashboard_stats', error: err.message };
  }
};
