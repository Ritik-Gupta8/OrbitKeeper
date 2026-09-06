import express from 'express';
import { runFullAnalysis, analyzeJob, getInterviewQuestions, askCareerAgent, getCareerHistory } from '../controllers/agentController.js';

const router = express.Router();

router.post('/analyze/:applicationId', runFullAnalysis);
router.post('/analyze-job', analyzeJob);
router.get('/interview/:applicationId', getInterviewQuestions);
router.post('/ask', askCareerAgent);
router.get('/history', getCareerHistory);

export default router;

