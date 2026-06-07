import React, { useEffect, useState, useRef } from 'react';
import { Save, Upload, Loader2, CheckCircle2, User, Target, Code2, FileText } from 'lucide-react';
import { getProfile, updateProfile, uploadResume } from '../lib/api.js';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const fileRef = useRef(null);

  useEffect(() => {
    getProfile().then(r => {
      setProfile(r.data.data || {});
      setLoading(false);
    });
  }, []);

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await uploadResume(fd);
      const extracted = res.data.data.extracted;
      // Update profile with extracted data
      setProfile(p => ({
        ...p,
        resumeFileName: file.name,
        resumeUploadedAt: new Date().toISOString(),
        ...(extracted.skills?.length && { skills: extracted.skills }),
        ...(extracted.name && { name: extracted.name }),
        ...(extracted.email && { email: extracted.email }),
      }));
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-indigo-400" /></div>;

  const tabs = [
    { id: 'info',   label: 'Personal Info', icon: User },
    { id: 'goals',  label: 'Career Goals',  icon: Target },
    { id: 'skills', label: 'Skills',        icon: Code2 },
    { id: 'resume', label: 'Resume',        icon: FileText },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Profile</h1>
          <p className="text-sm text-zinc-500">Your career information powers the AI agent</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {saved ? <CheckCircle2 size={14} /> : saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 flex gap-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors border-b-2 ${
              activeTab === id
                ? 'text-indigo-400 border-indigo-500'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F label="Full Name"><input className="inp" value={profile.name || ''} onChange={e => set('name', e.target.value)} placeholder="Jane Doe" /></F>
            <F label="Email"><input className="inp" type="email" value={profile.email || ''} onChange={e => set('email', e.target.value)} placeholder="jane@email.com" /></F>
            <F label="University"><input className="inp" value={profile.university || ''} onChange={e => set('university', e.target.value)} placeholder="MIT" /></F>
            <F label="Major"><input className="inp" value={profile.major || ''} onChange={e => set('major', e.target.value)} placeholder="Computer Science" /></F>
            <F label="Graduation Year"><input className="inp" value={profile.graduationYear || ''} onChange={e => set('graduationYear', e.target.value)} placeholder="2025" /></F>
            <F label="Phone"><input className="inp" value={profile.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" /></F>
            <F label="LinkedIn"><input className="inp" value={profile.linkedin || ''} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/jane" /></F>
            <F label="GitHub"><input className="inp" value={profile.github || ''} onChange={e => set('github', e.target.value)} placeholder="github.com/jane" /></F>
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="card p-5 space-y-4">
          <F label="Career Goals">
            <textarea className="inp resize-none" rows={4} value={profile.careerGoals || ''} onChange={e => set('careerGoals', e.target.value)} placeholder="I want to become a software engineer at a product company..." />
          </F>
          <F label="Target Roles (comma separated)">
            <input className="inp" value={profile.targetRoles?.join(', ') || ''} onChange={e => set('targetRoles', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Software Engineer Intern, ML Intern" />
          </F>
          <F label="Target Industries (comma separated)">
            <input className="inp" value={profile.targetIndustries?.join(', ') || ''} onChange={e => set('targetIndustries', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Technology, Finance, Healthcare" />
          </F>
          <F label="Preferred Locations (comma separated)">
            <input className="inp" value={profile.preferredLocations?.join(', ') || ''} onChange={e => set('preferredLocations', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="San Francisco, Remote, New York" />
          </F>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="card p-5 space-y-4">
          <F label="Programming Languages">
            <input className="inp" value={profile.programmingLanguages?.join(', ') || ''} onChange={e => set('programmingLanguages', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Python, JavaScript, Java, C++" />
          </F>
          <F label="Frameworks & Libraries">
            <input className="inp" value={profile.frameworks?.join(', ') || ''} onChange={e => set('frameworks', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="React, Node.js, TensorFlow, FastAPI" />
          </F>
          <F label="Tools & Platforms">
            <input className="inp" value={profile.tools?.join(', ') || ''} onChange={e => set('tools', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Git, Docker, AWS, MongoDB, PostgreSQL" />
          </F>
          <F label="All Skills (auto-populated from resume)">
            <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-800 border border-zinc-700 rounded-lg min-h-12">
              {(profile.skills || []).map((s, i) => (
                <span key={i} className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {s}
                  <button onClick={() => set('skills', profile.skills.filter((_, j) => j !== i))} className="hover:text-white">×</button>
                </span>
              ))}
              <input
                className="text-xs bg-transparent outline-none text-zinc-300 placeholder-zinc-600 min-w-24"
                placeholder="Add skill..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    set('skills', [...(profile.skills || []), e.target.value.trim()]);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </F>
        </div>
      )}

      {/* Resume Tab */}
      {activeTab === 'resume' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Upload Resume</h3>
            {profile.resumeFileName && (
              <div className="flex items-center gap-2 mb-3 p-3 bg-zinc-800/50 rounded-lg">
                <FileText size={14} className="text-indigo-400" />
                <span className="text-sm text-zinc-300">{profile.resumeFileName}</span>
                {profile.resumeUploadedAt && (
                  <span className="text-xs text-zinc-500 ml-auto">
                    {new Date(profile.resumeUploadedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleResumeUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 w-full justify-center py-8 border-2 border-dashed border-zinc-700 hover:border-indigo-600 rounded-xl text-sm text-zinc-500 hover:text-indigo-400 transition-colors"
            >
              {uploading
                ? <><Loader2 size={16} className="animate-spin" /> Analyzing resume with AI...</>
                : uploadSuccess
                ? <><CheckCircle2 size={16} className="text-green-400" /> Resume analyzed successfully!</>
                : <><Upload size={16} /> {profile.resumeFileName ? 'Upload new resume' : 'Upload PDF or TXT'}</>
              }
            </button>
            <p className="text-xs text-zinc-500 text-center mt-2">
              AI will extract your skills, projects, and experience automatically
            </p>
          </div>
        </div>
      )}

      <style>{`
        .inp {
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
        .inp:focus { border-color: #6366f1; }
        .inp::placeholder { color: #71717a; }
      `}</style>
    </div>
  );
}

function F({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
