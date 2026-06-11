import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';
import { getApplication, getInterviewQuestions } from '../lib/api.js';

const SECTION_CONFIG = [
  { key: 'technical',    emoji: '⚙️', label: 'Technical',    desc: 'DS&A, system design, coding concepts' },
  { key: 'behavioral',   emoji: '🤝', label: 'Behavioral',   desc: 'STAR format leadership & teamwork' },
  { key: 'projectBased', emoji: '🔨', label: 'Project-Based', desc: 'Your past projects deep dive' },
  { key: 'resumeBased',  emoji: '📄', label: 'Resume-Based',  desc: 'Questions from your resume' },
  { key: 'roleSpecific', emoji: '🏢', label: 'Role-Specific', desc: 'Company & role knowledge' },
];

export default function InterviewWorkspace() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState({ technical: true });

  useEffect(() => {
    getApplication(id).then(res => {
      const a = res.data.data;
      setApp(a);
      const qs = a.interviewQuestions;
      if (qs && Object.values(qs).some(arr => arr.length > 0)) {
        setQuestions(qs);
      }
      setLoading(false);
    });
  }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await getInterviewQuestions(id);
      setQuestions(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const toggleCheck = (key, index) => {
    const k = `${key}-${index}`;
    setChecked(c => ({ ...c, [k]: !c[k] }));
  };

  const toggleSection = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-indigo-400" /></div>;

  const totalQs = questions ? Object.values(questions).reduce((s, a) => s + a.length, 0) : 0;
  const doneQs = Object.keys(checked).filter(k => checked[k]).length;

  return (
    <div className="relative max-w-3xl space-y-5">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="ok-animate-blob absolute -top-32 right-10 w-[28rem] h-[28rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="ok-animate-blob absolute bottom-0 -left-32 w-[28rem] h-[28rem] rounded-full bg-purple-600/20 blur-3xl" style={{ animationDelay: '6s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between ok-animate-fade-up">
        <div className="flex items-center gap-3">
          <Link to={`/applications/${id}`} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors active:scale-95">
            <ArrowLeft size={14} className="text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="ok-gradient-text">Interview Workspace</span>
            </h1>
            {app && <p className="text-sm text-zinc-400">{app.company} · {app.role}</p>}
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Generating...' : questions ? 'Regenerate' : 'Generate Questions'}
        </button>
      </div>

      {/* Progress */}
      {totalQs > 0 && (
        <div className="glass rounded-xl p-4 ok-animate-fade-up ok-delay-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Preparation Progress</span>
            <span className="text-sm font-medium text-zinc-200">{doneQs}/{totalQs} reviewed</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${totalQs > 0 ? (doneQs / totalQs) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Questions */}
      {!questions ? (
        <div className="glass rounded-xl p-12 flex flex-col items-center gap-4 text-center ok-animate-fade-up ok-delay-1">
          <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center ok-animate-float">
            <Sparkles size={22} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-medium text-zinc-200">Personalized Interview Questions</h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm">
              Generate AI-crafted questions based on this specific role, company, and your resume.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Generating questions...' : 'Generate Questions'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {SECTION_CONFIG.map(({ key, emoji, label, desc }, idx) => {
            const qs = questions[key] || [];
            if (!qs.length) return null;
            const isExpanded = expanded[key];
            const sectionDone = qs.filter((_, i) => checked[`${key}-${i}`]).length;

            return (
              <div key={key} className={`glass rounded-xl overflow-hidden ok-animate-fade-up ok-delay-${(idx % 5) + 1}`}>
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{emoji}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium text-zinc-200">{label}</div>
                      <div className="text-xs text-zinc-500">{desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{sectionDone}/{qs.length}</span>
                    {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-zinc-800 divide-y divide-zinc-800">
                    {qs.map((q, i) => {
                      const k = `${key}-${i}`;
                      const done = checked[k];
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                          onClick={() => toggleCheck(key, i)}
                        >
                          {done
                            ? <CheckCircle2 size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                            : <Circle size={15} className="text-zinc-600 flex-shrink-0 mt-0.5" />
                          }
                          <span className={`text-sm leading-relaxed ${done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                            {q}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Prep Tips */}
          {questions.preparationTips && (
            <div className="glass rounded-xl p-5 ok-animate-fade-up">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">💡 Preparation Tips</h3>
              <ul className="space-y-1.5">
                {questions.preparationTips.map((tip, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                    <span className="text-yellow-400 flex-shrink-0">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
