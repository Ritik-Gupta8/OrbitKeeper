import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../lib/firebase.js';
import { Loader2, Target, Brain, MessageSquare, BellRing, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      // AuthContext will automatically detect the user and redirect
      navigate('/dashboard');
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  const features = [
    { icon: Target,        title: 'Smart Match Score',   desc: 'AI scores your resume against each job 0–100' },
    { icon: Brain,         title: 'Skill Gap Analysis',  desc: 'Know exactly what to learn before you apply' },
    { icon: MessageSquare, title: 'AI Career Copilot',   desc: 'Ask anything about your applications' },
    { icon: BellRing,      title: 'Deadline Reminders',  desc: 'Automated alerts so you never miss a date' },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden flex items-center justify-center p-4">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ok-animate-blob absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="ok-animate-blob absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" style={{ animationDelay: '4s' }} />
        <div className="ok-animate-blob absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-fuchsia-600/10 blur-3xl" style={{ animationDelay: '8s' }} />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      {/* Content grid */}
      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
        {/* ── Left: Brand + feature highlights ── */}
        <div className="hidden lg:flex flex-col gap-8 ok-animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden flex items-center justify-center ok-animate-float">
              <img src="/favicon.png" alt="OrbitKeeper Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-100 leading-none">OrbitKeeper</div>
              <div className="text-xs text-indigo-400 mt-1">AI Career Agent</div>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Land your next role with an{' '}
              <span className="ok-gradient-text">AI agent</span> in your corner.
            </h2>
            <p className="text-zinc-400 mt-4 text-sm leading-relaxed max-w-md">
              OrbitKeeper doesn't just track applications — it analyzes job fit, plans your prep,
              and keeps you ahead of every deadline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className={`glass rounded-xl p-4 hover:border-indigo-700/50 transition-colors ok-animate-fade-up ok-delay-${i + 1}`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600/15 flex items-center justify-center mb-2.5">
                  <Icon size={15} className="text-indigo-400" />
                </div>
                <div className="text-sm font-medium text-zinc-100">{title}</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-snug">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Login card ── */}
        <div className="w-full max-w-md mx-auto ok-animate-fade-up ok-delay-2">
          {/* Mobile logo (shown only on small screens) */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden mb-3 ok-animate-float">
              <img src="/favicon.png" alt="OrbitKeeper Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Welcome to OrbitKeeper</h1>
            <p className="text-zinc-400 text-sm mt-1">AI Career Agent for Internship Applications</p>
          </div>

          <div className="relative glass rounded-2xl p-8 shadow-2xl shadow-indigo-950/30">
            {/* gradient top border accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

            <div className="text-center mb-7">
              <h2 className="text-xl font-semibold text-zinc-100">Sign in to continue</h2>
              <p className="text-sm text-zinc-500 mt-1.5">
                Track applications, get AI insights, and ace your interviews
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group w-full bg-white hover:bg-zinc-50 text-zinc-900 font-medium py-3 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path
                      fill="#4285F4"
                      d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
                    />
                    <path
                      fill="#34A853"
                      d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"
                    />
                    <path
                      fill="#EA4335"
                      d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Trust row */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <ShieldCheck size={13} className="text-emerald-500/80" />
              <span>Secured by Google OAuth · No passwords stored</span>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">
                Built for the Google Cloud Agent Builder Hackathon
              </p>
            </div>
          </div>

          {/* Quick stat chips below card */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="glass rounded-xl py-3 ok-animate-fade-up ok-delay-3">
              <div className="text-lg font-bold ok-gradient-text">6</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">AI Agents</p>
            </div>
            <div className="glass rounded-xl py-3 ok-animate-fade-up ok-delay-4">
              <div className="text-lg font-bold ok-gradient-text">0–100</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Match Score</p>
            </div>
            <div className="glass rounded-xl py-3 ok-animate-fade-up ok-delay-5">
              <div className="text-lg font-bold ok-gradient-text">24/7</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Deadline Watch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
