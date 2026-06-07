import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ApplicationTracker from './pages/ApplicationTracker.jsx';
import ApplicationDetail from './pages/ApplicationDetail.jsx';
import NewApplication from './pages/NewApplication.jsx';
import InterviewWorkspace from './pages/InterviewWorkspace.jsx';
import Profile from './pages/Profile.jsx';
import CopilotChat from './pages/CopilotChat.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="applications" element={<ApplicationTracker />} />
          <Route path="applications/new" element={<NewApplication />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="interview/:id" element={<InterviewWorkspace />} />
          <Route path="copilot" element={<CopilotChat />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
