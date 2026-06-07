import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { createApplication, analyzeJob } from '../lib/api.js';

const STATUS_OPTIONS = ['saved', 'applied', 'phone_screen', 'technical', 'interview', 'offer', 'rejected'];
const TYPE_OPTIONS = ['internship', 'full-time', 'part-time', 'contract'];

export default function NewApplication() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company: '',
    role: '',
    location: '',
    jobType: 'internship',
    jobUrl: '',
    status: 'saved',
    deadline: '',
    jobDescription: '',
    notes: '',
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleAnalyzePreview = async () => {
    if (!form.jobDescription.trim()) return;
    setAnalyzing(true);
    setPreview(null);
    try {
      const res = await analyzeJob({ jobDescription: form.jobDescription, company: form.company });
      const data = res.data.data;
      setPreview(data);
      // Auto-fill fields
      if (data.company && !form.company) set('company', data.company);
      if (data.role && !form.role) set('role', data.role);
      if (data.location) set('location', data.location);
      if (data.jobType) set('jobType', data.jobType);
      if (data.deadline) set('deadline', data.deadline?.split('T')[0] || '');
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.company.trim()) errs.company = 'Company is required';
    if (!form.role.trim()) errs.role = 'Role is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const res = await createApplication({
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      navigate(`/applications/${res.data.data._id}`);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
          <ArrowLeft size={14} className="text-zinc-400" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">New Application</h1>
          <p className="text-sm text-zinc-500">Paste a job description to let the AI analyze it</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Job Description first — AI fills the rest */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Job Description</label>
            <button
              type="button"
              onClick={handleAnalyzePreview}
              disabled={!form.jobDescription.trim() || analyzing}
              className="flex items-center gap-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {analyzing ? 'Analyzing...' : 'AI Analyze'}
            </button>
          </div>
          <textarea
            rows={8}
            placeholder="Paste the full job description here. The AI will extract company, role, skills, and deadline automatically..."
            value={form.jobDescription}
            onChange={e => set('jobDescription', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* AI Preview */}
        {preview && (
          <div className="card p-4 border-indigo-800/50 bg-indigo-950/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-xs font-medium text-indigo-400">AI Analysis Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-zinc-500">Company:</span> <span className="text-zinc-200">{preview.company || '—'}</span></div>
              <div><span className="text-zinc-500">Role:</span> <span className="text-zinc-200">{preview.role || '—'}</span></div>
              <div><span className="text-zinc-500">Location:</span> <span className="text-zinc-200">{preview.location || '—'}</span></div>
              <div><span className="text-zinc-500">Deadline:</span> <span className="text-zinc-200">{preview.deadline ? new Date(preview.deadline).toLocaleDateString() : '—'}</span></div>
            </div>
            {preview.requiredSkills?.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-zinc-500">Required Skills: </span>
                <span className="text-xs text-zinc-300">{preview.requiredSkills.join(', ')}</span>
              </div>
            )}
            {preview.summary && <p className="text-xs text-zinc-400 mt-2">{preview.summary}</p>}
          </div>
        )}

        {/* Manual Fields */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Application Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Company *" error={errors.company}>
              <input
                type="text"
                placeholder="Google"
                value={form.company}
                onChange={e => { set('company', e.target.value); setErrors(er => ({ ...er, company: '' })); }}
                className="input-field"
              />
            </Field>
            <Field label="Role *" error={errors.role}>
              <input
                type="text"
                placeholder="Software Engineering Intern"
                value={form.role}
                onChange={e => { set('role', e.target.value); setErrors(er => ({ ...er, role: '' })); }}
                className="input-field"
              />
            </Field>
            <Field label="Location">
              <input type="text" placeholder="Mountain View, CA" value={form.location} onChange={e => set('location', e.target.value)} className="input-field" />
            </Field>
            <Field label="Job Type">
              <select value={form.jobType} onChange={e => set('jobType', e.target.value)} className="input-field">
                {TYPE_OPTIONS.map(t => <option key={t} value={t} className="bg-zinc-800 capitalize">{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
                {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-zinc-800 capitalize">{s.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Deadline">
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className="input-field" />
            </Field>
          </div>

          <Field label="Job URL (optional)">
            <input type="url" placeholder="https://careers.google.com/..." value={form.jobUrl} onChange={e => set('jobUrl', e.target.value)} className="input-field" />
          </Field>

          <Field label="Notes">
            <textarea rows={3} placeholder="Any notes..." value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field resize-none" />
          </Field>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Application'}
          </button>
        </div>
      </form>

      <style>{`
        .input-field {
          width: 100%;
          background: #27272a;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          color: #e4e4e7;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: #6366f1; }
        .input-field::placeholder { color: #71717a; }
      `}</style>
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
