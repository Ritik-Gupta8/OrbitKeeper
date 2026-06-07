import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2, Circle,
  ExternalLink, Clock, Target, AlertTriangle, Lightbulb,
  BookOpen, Brain, ChevronDown, ChevronUp, Edit2, Check, X
} from 'lucide-react';
import { getApplication, updateApplication, runFullAnalysis } from '../lib/api.js';
import { STATUS_CONFIG, formatDeadline, PRIORITY_CONFIG, getMatchColor, getMatchBg } from '../lib/utils.js';
import StatusBadge from '../components/StatusBadge.jsx';
import MatchScore from '../components/MatchScore.jsx';
import AgentThinking from '../components/AgentThinking.jsx';

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [editStatus, setEditStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const refresh = async () => {
    const res = await getApplication(id);
    setApp(res.data.data);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [id]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      await runFullAnalysis(id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (status) => {
    await updateApplication(id, { status });
    setApp(a => ({ ...a, status }));
    setEditStatus(false);
  };

  const toggleTask = async (taskIndex) => {
    const newPlan = app.actionPlan.map((t, i) =>
      i === taskIndex ? { ...t, completed: !t.completed } : t
    );
    await updateApplication(id, { actionPlan: newPlan });
    setApp(a => ({ ...a, actionPlan: newPlan }));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-indigo-400" /></div>;
  if (!app) return <div className="text-zinc-400">Application not found</div>;

  const dl = app.deadline ? formatDeadline(app.deadline) : null;
  const hasAnalysis = app.matchScore > 0 || app.jobSummary?.summary;
  const completedTasks = app.actionPlan?.filter(t => t.completed).length || 0;

  const tabs = [
    { id: 'overview',    label: 'Overview',   show: true },
    { id: 'analysis',    label: 'Analysis',   show: hasAnalysis },
    { id: 'plan',        label: 'Action Plan', show: app.actionPlan?.length > 0 },
    { id: 'interview',   label: 'Interview',   show: Object.values(app.interviewQuestions || {}).some(a => a.length > 0) },
  ];

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <ArrowLeft size={14} className="text-zinc-400" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">{app.company}</h1>
            <p className="text-sm text-zinc-400">{app.role} {app.location && `· ${app.location}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {app.jobUrl && (
            <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ExternalLink size={14} className="text-zinc-400" />
            </a>
          )}
          <Link to={`/interview/${id}`} className="flex items-center gap-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors">
            <Brain size={14} /> Interview
          </Link>
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing || !app.jobDescription}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            <Sparkles size={14} />
            {analyzing ? 'Analyzing...' : hasAnalysis ? 'Re-analyze' : 'Run AI Analysis'}
          </button>
        </div>
      </div>

      {analyzing && <AgentThinking />}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Status */}
        <div className="card p-4">
          <p className="text-xs text-zinc-500 mb-2">Status</p>
          {editStatus ? (
            <select
              autoFocus
              value={app.status}
              onChange={e => handleStatusChange(e.target.value)}
              onBlur={() => setEditStatus(false)}
              className="w-full text-xs bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-zinc-200"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
            </select>
          ) : (
            <button onClick={() => setEditStatus(true)} className="hover:opacity-80 transition-opacity">
              <StatusBadge status={app.status} />
            </button>
          )}
        </div>

        {/* Match Score */}
        <div className="card p-4">
          <p className="text-xs text-zinc-500 mb-2">Match Score</p>
          {hasAnalysis
            ? <MatchScore score={app.matchScore} size="lg" />
            : <span className="text-sm text-zinc-600">Not analyzed</span>
          }
        </div>

        {/* Deadline */}
        <div className="card p-4">
          <p className="text-xs text-zinc-500 mb-2">Deadline</p>
          {dl ? (
            <div>
              <div className="text-sm font-medium text-zinc-200">{dl.formatted}</div>
              <div className={`text-xs ${dl.urgent ? 'text-red-400' : dl.past ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {dl.past ? 'Passed' : dl.label}
              </div>
            </div>
          ) : <span className="text-sm text-zinc-600">—</span>}
        </div>

        {/* Progress */}
        <div className="card p-4">
          <p className="text-xs text-zinc-500 mb-2">Tasks Done</p>
          <div className="text-2xl font-bold text-zinc-100">{completedTasks}/{app.actionPlan?.length || 0}</div>
          {app.actionPlan?.length > 0 && (
            <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(completedTasks / app.actionPlan.length) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-0">
          {tabs.filter(t => t.show).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-indigo-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab app={app} />}
      {activeTab === 'analysis' && <AnalysisTab app={app} />}
      {activeTab === 'plan' && <PlanTab app={app} onToggleTask={toggleTask} />}
      {activeTab === 'interview' && <InterviewTab app={app} applicationId={id} />}
    </div>
  );
}

function OverviewTab({ app }) {
  return (
    <div className="space-y-4">
      {app.jobSummary?.summary && (
        <div className="card p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-2">Job Summary</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{app.jobSummary.summary}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {app.jobSummary?.requiredSkills?.length > 0 && (
          <SkillList title="Required Skills" skills={app.jobSummary.requiredSkills} color="indigo" />
        )}
        {app.jobSummary?.preferredSkills?.length > 0 && (
          <SkillList title="Preferred Skills" skills={app.jobSummary.preferredSkills} color="purple" />
        )}
      </div>
      {app.notes && (
        <div className="card p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-2">Notes</h3>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{app.notes}</p>
        </div>
      )}
      {app.jobDescription && (
        <Collapsible title="Full Job Description">
          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{app.jobDescription}</p>
        </Collapsible>
      )}
    </div>
  );
}

function AnalysisTab({ app }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {app.strengthAreas?.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} className="text-green-400" />
              <h3 className="text-sm font-medium text-zinc-300">Strengths</h3>
            </div>
            <ul className="space-y-1.5">
              {app.strengthAreas.map((s, i) => (
                <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">+</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {app.missingSkills?.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-yellow-400" />
              <h3 className="text-sm font-medium text-zinc-300">Missing Skills</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {app.missingSkills.map((s, i) => (
                <span key={i} className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      {app.improvementSuggestions?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-purple-400" />
            <h3 className="text-sm font-medium text-zinc-300">Improvement Suggestions</h3>
          </div>
          <ul className="space-y-2">
            {app.improvementSuggestions.map((s, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                <span className="text-purple-400 mt-0.5 flex-shrink-0">→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PlanTab({ app, onToggleTask }) {
  const priorities = ['high', 'medium', 'low'];
  return (
    <div className="space-y-4">
      {priorities.map(priority => {
        const tasks = app.actionPlan?.filter(t => t.priority === priority) || [];
        if (!tasks.length) return null;
        const cfg = PRIORITY_CONFIG[priority];
        return (
          <div key={priority} className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
                {cfg.label} Priority
              </span>
            </div>
            <ul className="space-y-2">
              {tasks.map((task, i) => {
                const globalIndex = app.actionPlan.indexOf(task);
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 cursor-pointer group"
                    onClick={() => onToggleTask(globalIndex)}
                  >
                    {task.completed
                      ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                      : <Circle size={16} className="text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5 transition-colors" />
                    }
                    <span className={`text-sm ${task.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                      {task.task}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function InterviewTab({ app, applicationId }) {
  const questions = app.interviewQuestions || {};
  const sections = [
    { key: 'technical',    label: '⚙️ Technical',    qs: questions.technical },
    { key: 'behavioral',   label: '🤝 Behavioral',   qs: questions.behavioral },
    { key: 'projectBased', label: '🔨 Project-Based', qs: questions.projectBased },
    { key: 'resumeBased',  label: '📄 Resume-Based',  qs: questions.resumeBased },
    { key: 'roleSpecific', label: '🏢 Role-Specific', qs: questions.roleSpecific },
  ].filter(s => s.qs?.length > 0);

  if (!sections.length) {
    return (
      <div className="card p-10 text-center">
        <Brain size={28} className="text-zinc-700 mx-auto mb-3" />
        <p className="text-sm text-zinc-400">No interview questions yet.</p>
        <p className="text-xs text-zinc-500 mt-1">Run the AI analysis to generate personalized questions.</p>
        <Link to={`/interview/${applicationId}`} className="inline-flex items-center gap-1.5 mt-4 text-sm text-indigo-400 hover:text-indigo-300">
          Open Interview Workspace →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to={`/interview/${applicationId}`} className="flex items-center justify-end gap-1.5 text-sm text-indigo-400 hover:text-indigo-300">
        <BookOpen size={13} /> Open Interview Workspace
      </Link>
      {sections.map(({ label, qs }) => (
        <div key={label} className="card p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">{label}</h3>
          <ol className="space-y-2 list-decimal list-inside">
            {qs.map((q, i) => (
              <li key={i} className="text-sm text-zinc-400">{q}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function SkillList({ title, skills, color }) {
  const colors = {
    indigo: 'bg-indigo-900/30 text-indigo-300',
    purple: 'bg-purple-900/30 text-purple-300',
  };
  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-zinc-300 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded-full ${colors[color]}`}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function Collapsible({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}
