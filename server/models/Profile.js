import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  userId: { type: String, default: 'default', unique: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  university: { type: String, default: '' },
  major: { type: String, default: '' },
  graduationYear: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' },

  // Career Goals
  careerGoals: { type: String, default: '' },
  targetRoles: [String],
  targetIndustries: [String],
  preferredLocations: [String],

  // Skills
  skills: [String],
  programmingLanguages: [String],
  frameworks: [String],
  tools: [String],

  // Resume
  resumeText: { type: String, default: '' },
  resumeFileName: { type: String, default: '' },
  resumeUploadedAt: { type: Date },

  // Experience
  workExperience: [{
    company: String,
    role: String,
    duration: String,
    description: String,
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    year: String,
  }],
  projects: [{
    name: String,
    description: String,
    techStack: [String],
    url: String,
  }],

}, { timestamps: true });

export default mongoose.model('Profile', profileSchema);
