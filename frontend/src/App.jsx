import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Landing    from './pages/Landing'
import Dashboard  from './pages/Dashboard'
import Candidates from './pages/Candidates'
import Jobs       from './pages/Jobs'
import CreateJob  from './pages/CreateJob'
import Interview  from './pages/Interview'
import Reports    from './pages/Reports'
import Login      from './pages/Login'
import Register   from './pages/Register'
import CandidateDashboard from './pages/CandidateDashboard'
import RecruiterProfile from './pages/RecruiterProfile'
import AdminDashboard from './pages/AdminDashboard'
import Applicants from './pages/Applicants'
import MyApplications from './pages/MyApplications'
import ResumeUpload from './pages/ResumeUpload'
import CandidateRanking from './pages/CandidateRanking'
import InterviewPlanner from './pages/InterviewPlanner'
import Analytics from './pages/Analytics'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Recruiter & Admin shell */}
        <Route element={<ProtectedRoute allowedRoles={['Recruiter', 'Admin']} />}>
          <Route element={<Layout />}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/jobs/create"   element={<CreateJob />} />
            <Route path="/jobs/edit/:id" element={<CreateJob />} />
            <Route path="/interview"     element={<Interview />} />
            <Route path="/analytics"     element={<Analytics />} />
            <Route path="/reports"       element={<Reports />} />
            <Route path="/recruiter-profile" element={<RecruiterProfile />} />
            <Route path="/applicants/:jobId" element={<Applicants />} />
            <Route path="/applications/:applicationId/interview" element={<InterviewPlanner />} />
          </Route>
        </Route>

        {/* Candidate shell */}
        <Route element={<ProtectedRoute allowedRoles={['Candidate']} />}>
          <Route element={<Layout />}>
            <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
            <Route path="/candidate-profile"   element={<CandidateDashboard />} />
            <Route path="/my-applications"     element={<MyApplications />} />
            <Route path="/resume"              element={<ResumeUpload />} />
          </Route>
        </Route>

        {/* Admin shell */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Shared authenticated routes */}
        <Route element={<ProtectedRoute allowedRoles={['Recruiter', 'Admin', 'Candidate']} />}>
          <Route element={<Layout />}>
            <Route path="/jobs" element={<Jobs />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
