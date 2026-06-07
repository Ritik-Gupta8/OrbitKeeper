import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AgentThinking({ steps = [] }) {
  const defaultSteps = [
    'Analyzing job description...',
    'Extracting required skills...',
    'Comparing with your resume...',
    'Calculating match score...',
    'Generating action plan...',
    'Creating interview questions...',
    'Storing to MongoDB via MCP...',
  ];

  const displaySteps = steps.length > 0 ? steps : defaultSteps;

  return (
    <div className="card p-6 flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center">
        <Sparkles size={20} className="text-indigo-400 animate-pulse" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-200 text-center mb-1">AI Agent Running</h3>
        <p className="text-xs text-zinc-500 text-center">This may take 20-30 seconds</p>
      </div>
      <div className="w-full space-y-1.5 max-w-xs">
        {displaySteps.map((step, i) => (
          <div key={i} className="flex items-center gap-2" style={{ animationDelay: `${i * 0.3}s` }}>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
            <span className="text-xs text-zinc-400">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
