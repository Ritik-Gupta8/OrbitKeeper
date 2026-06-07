import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { extractResumeInfo } from '../agents/resumeAnalysisAgent.js';
import { updateProfile } from '../mcp/mongoMCP.js';

// Use memory storage (no disk needed)
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
});

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const userId = req.headers['x-user-id'] || 'default';
    let resumeText = '';

    // Parse PDF or plain text
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text;
    } else {
      resumeText = req.file.buffer.toString('utf-8');
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    // Use AI agent to extract structured info
    const extracted = await extractResumeInfo(resumeText);

    // Store via MCP
    const profileUpdates = {
      resumeText,
      resumeFileName: req.file.originalname,
      resumeUploadedAt: new Date(),
      ...(extracted.skills?.length && { skills: extracted.skills }),
      ...(extracted.programmingLanguages?.length && { programmingLanguages: extracted.programmingLanguages }),
      ...(extracted.frameworks?.length && { frameworks: extracted.frameworks }),
      ...(extracted.tools?.length && { tools: extracted.tools }),
      ...(extracted.education?.length && { education: extracted.education }),
      ...(extracted.workExperience?.length && { workExperience: extracted.workExperience }),
      ...(extracted.projects?.length && { projects: extracted.projects }),
      ...(extracted.name && { name: extracted.name }),
      ...(extracted.email && { email: extracted.email }),
    };

    await updateProfile(userId, profileUpdates);

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        textLength: resumeText.length,
        extracted,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: error.message });
  }
};
