import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  // Core Info
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  location: { type: String, default: '' },
  jobType: { type: String, enum: ['internship', 'full-time', 'part-time', 'contract'], default: 'internship' },
  jobUrl: { type: String, default: '' },

  // Status
  status: {
    type: String,
    enum: ['saved', 'applied', 'phone_screen', 'technical', 'interview', 'offer', 'rejected', 'withdrawn'],
    default: 'saved',
  },

  // Dates
  deadline: { type: Date },
  appliedDate: { type: Date },
  interviewDate: { type: Date },

  // AI Analysis
  jobDescription: { type: String, default: '' },
  jobSummary: {
    requiredSkills: [String],
    preferredSkills: [String],
    experienceRequired: String,
    responsibilities: [String],
    benefits: [String],
    summary: String,
  },

  matchScore: { type: Number, min: 0, max: 100, default: 0 },
  strengthAreas: [String],
  weaknessAreas: [String],
  missingSkills: [String],
  improvementSuggestions: [String],

  // Career Plan
  actionPlan: [{
    task: String,
    priority: { type: String, enum: ['high', 'medium', 'low'] },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],

  // Interview Prep
  interviewQuestions: {
    technical: [String],
    behavioral: [String],
    projectBased: [String],
    resumeBased: [String],
    roleSpecific: [String],
  },

  // Notes
  notes: { type: String, default: '' },

  // Deadline Reminders
  reminder24hSent: { type: Boolean, default: false },
  reminder12hSent: { type: Boolean, default: false },

  // User reference (for future multi-user support)
  userId: { type: String, default: 'default' },

}, { timestamps: true });

// Index for deadline monitoring
applicationSchema.index({ deadline: 1, status: 1 });
applicationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Application', applicationSchema);
