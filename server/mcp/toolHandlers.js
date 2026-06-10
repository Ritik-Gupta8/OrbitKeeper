/**
 * MCP Tool Handlers
 *
 * These are the actual implementations called by the MCP server when
 * an agent invokes a tool. Each handler maps 1-to-1 with a registered
 * MCP tool name. Handlers call Mongoose directly and return plain objects.
 *
 * Separation of concerns:
 *   mcpServer.js  → protocol layer  (registers tools, validates schemas)
 *   toolHandlers.js → business layer (executes the MongoDB operation)
 *   mongoMCP.js   → legacy layer    (still used by non-MCP paths)
 */

import Application from '../models/Application.js';
import NotificationLog from '../models/NotificationLog.js';
import Profile from '../models/Profile.js';
import mongoose from 'mongoose';

// ── Helpers ───────────────────────────────────────────────────────────────────

const toObj = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  // Convert ObjectId to string for clean JSON output
  if (o._id) o._id = o._id.toString();
  return o;
};

const safeId = (id) => {
  if (!id) throw new Error('id is required');
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error(`Invalid id: ${id}`);
  return id;
};

// ── Application Handlers ──────────────────────────────────────────────────────

export async function handle_find_documents({ collection, filter = {}, limit = 50, sort = {} }) {
  const Model = resolveModel(collection);
  // If filtering by _id, use findById for reliable ObjectId matching
  if (filter._id && typeof filter._id === 'string' && Object.keys(filter).length === 1) {
    const doc = await Model.findById(filter._id);
    return { documents: doc ? [toObj(doc)] : [], count: doc ? 1 : 0 };
  }
  const docs = await Model.find(filter).sort(sort).limit(limit);
  return { documents: docs.map(toObj), count: docs.length };
}

export async function handle_insert_document({ collection, document }) {
  const Model = resolveModel(collection);
  const doc = new Model(document);
  await doc.save();
  return { inserted: toObj(doc), insertedId: doc._id.toString() };
}

export async function handle_update_document({ collection, id, updates }) {
  const Model = resolveModel(collection);
  safeId(id);
  const doc = await Model.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!doc) throw new Error(`Document not found: ${id}`);
  return { updated: toObj(doc) };
}

export async function handle_delete_document({ collection, id }) {
  const Model = resolveModel(collection);
  safeId(id);
  await Model.findByIdAndDelete(id);
  return { deleted: true, id };
}

export async function handle_aggregate({ collection, pipeline }) {
  const Model = resolveModel(collection);
  const result = await Model.aggregate(pipeline);
  return { result, count: result.length };
}

export async function handle_list_collections() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  return { collections: collections.map(c => c.name) };
}

// ── Career-Specific Handlers ──────────────────────────────────────────────────

export async function handle_store_ai_analysis({ applicationId, analysis }) {
  safeId(applicationId);
  const updates = {
    jobSummary:             analysis.jobSummary             || {},
    matchScore:             analysis.matchScore             || 0,
    strengthAreas:          analysis.strengthAreas          || [],
    weaknessAreas:          analysis.weaknessAreas          || [],
    missingSkills:          analysis.missingSkills          || [],
    improvementSuggestions: analysis.improvementSuggestions || [],
    actionPlan:             analysis.actionPlan             || [],
    interviewQuestions:     analysis.interviewQuestions     || {},
  };
  const app = await Application.findByIdAndUpdate(applicationId, updates, { new: true });
  if (!app) throw new Error(`Application not found: ${applicationId}`);
  return { stored: true, application: toObj(app) };
}

export async function handle_get_upcoming_deadlines({ hoursAhead = 25, userId }) {
  const now    = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  
  const filter = {
    deadline: { $gte: now, $lte: future },
    // Only send reminders for applications that need to be submitted
    // Include: saved (not applied yet)
    // Exclude: applied, phone_screen, technical, interview, offer, rejected, withdrawn
    status: 'saved',
  };
  
  // Filter by userId if provided (for multi-user support)
  if (userId) {
    filter.userId = userId;
  }
  
  // Use lean() to bypass Mongoose caching and get fresh data
  const apps = await Application.find(filter).lean().read('primary');
  return { applications: apps.map(toObj), count: apps.length };
}

export async function handle_get_dashboard_stats({ userId = 'default' }) {
  const byStatus = await Application.aggregate([
    { $match: { userId } },
    { $group: { _id: '$status', count: { $sum: 1 }, avgMatch: { $avg: '$matchScore' } } },
  ]);
  const total    = await Application.countDocuments({ userId });
  const recent   = await Application.find({ userId }).sort({ createdAt: -1 }).limit(5)
    .select('company role status matchScore createdAt');
  const upcoming = await Application.find({
    userId,
    deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    status:   { $nin: ['rejected', 'withdrawn'] },
  }).sort({ deadline: 1 }).limit(5);

  return {
    total,
    byStatus:           byStatus.reduce((a, s) => ({ ...a, [s._id]: s.count }), {}),
    avgMatchScore:      Math.round(byStatus.reduce((s, x) => s + (x.avgMatch || 0), 0) / (byStatus.length || 1)),
    recentApplications: recent.map(toObj),
    upcomingDeadlines:  upcoming.map(toObj),
  };
}

export async function handle_mark_reminder_sent({ applicationId, type }) {
  safeId(applicationId);
  const field = type === '24h' ? { reminder24hSent: true } : { reminder12hSent: true };
  const app   = await Application.findByIdAndUpdate(applicationId, field, { new: true });
  if (!app) throw new Error(`Application not found: ${applicationId}`);
  return { marked: true, application: toObj(app) };
}

export async function handle_log_notification({ data }) {
  const log = new NotificationLog(data);
  await log.save();
  return { logged: true, logId: log._id.toString() };
}

export async function handle_get_profile({ userId = 'default' }) {
  // Use findOne with retry logic to handle MongoDB replication lag
  let profile = await Profile.findOne({ userId });
  
  // Retry up to 3 times with increasing delays if resume text is missing/empty
  let retries = 0;
  while ((!profile || !profile.resumeText || profile.resumeText.length === 0) && retries < 3) {
    const delay = 200 * (retries + 1); // 200ms, 400ms, 600ms
    console.log(`[MCP:get_profile] Retry ${retries + 1}/3 after ${delay}ms for userId: ${userId}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    profile = await Profile.findOne({ userId });
    retries++;
  }
  
  // If still not found, create new empty profile
  if (!profile) { 
    console.log(`[MCP:get_profile] Creating new profile for userId: ${userId}`);
    profile = new Profile({ userId }); 
    await profile.save(); 
  } else {
    console.log(`[MCP:get_profile] Profile found. Resume text length: ${profile.resumeText?.length || 0}`);
  }
  
  return { profile: toObj(profile) };
}

export async function handle_update_profile({ userId = 'default', updates }) {
  // Never allow clearing resumeText accidentally
  // If updates doesn't include resumeText, fetch existing and preserve it
  let existingResumeText = null;
  if (!updates.resumeText) {
    const existing = await Profile.findOne({ userId });
    if (existing?.resumeText) {
      existingResumeText = existing.resumeText;
      console.log(`[MCP:update_profile] Preserving existing resume text (${existingResumeText.length} chars)`);
    }
  }
  
  const finalUpdates = {
    ...updates,
    userId,
    // Preserve resumeText if not in updates
    ...(existingResumeText && { resumeText: existingResumeText }),
  };
  
  const profile = await Profile.findOneAndUpdate(
    { userId },
    finalUpdates,
    { new: true, upsert: true, runValidators: true, writeConcern: { w: 'majority' } }
  );
  console.log(`[MCP:update_profile] Updated profile for userId: ${userId}, Resume length: ${profile.resumeText?.length || 0}`);
  return { updated: true, profile: toObj(profile) };
}

export async function handle_search_applications({ query, userId }) {
  const regex   = new RegExp(query, 'i');
  const filter  = {
    $or: [{ company: regex }, { role: regex }, { notes: regex }, { jobDescription: regex }],
  };
  if (userId) filter.userId = userId;
  const apps = await Application.find(filter).limit(20);
  return { applications: apps.map(toObj), count: apps.length };
}

// ── Model Registry ────────────────────────────────────────────────────────────

function resolveModel(name) {
  const map = {
    applications:      Application,
    notification_logs: NotificationLog,
    profiles:          Profile,
  };
  const Model = map[name];
  if (!Model) throw new Error(`Unknown collection: "${name}". Valid: ${Object.keys(map).join(', ')}`);
  return Model;
}
