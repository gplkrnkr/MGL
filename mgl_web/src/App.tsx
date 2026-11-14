import { Route, Routes } from 'react-router-dom'
import { Landing } from './routes/Landing'
import { WorkerLogin } from './routes/worker/WorkerLogin'
import { JobList } from './routes/worker/JobList'
import { JobDetail } from './routes/worker/JobDetail'
import { MyApplications } from './routes/worker/MyApplications'
import { WorkerProfile } from './routes/worker/WorkerProfile'
import { EmployerLogin } from './routes/employer/EmployerLogin'
import { Dashboard } from './routes/employer/Dashboard'
import { JobForm } from './routes/employer/JobForm'
import { JobApplicants } from './routes/employer/JobApplicants'
import { EmployerPortal } from './routes/employer/EmployerPortal'
import { AdminLogin } from './routes/admin/AdminLogin'
import { DocumentReview } from './routes/admin/DocumentReview'
import { ApplicationReview } from './routes/admin/ApplicationReview'
import { AgentManagement } from './routes/admin/AgentManagement'
import { AgentLogin } from './routes/agent/AgentLogin'
import { AgentPortal } from './routes/agent/AgentPortal'
import { NotFound } from './routes/NotFound'
import { WorkerRoute, EmployerRoute, AdminRoute, AgentRoute } from './components/ProtectedRoute'
import { AgentAppDemo } from './routes/demo/AgentAppDemo'
import { FraudDetectionDemo } from './routes/demo/FraudDetectionDemo'
import { GovtDashboardDemo } from './routes/demo/GovtDashboardDemo'
import { AiMatchingDemo } from './routes/demo/AiMatchingDemo'
import { GccOverseasDemo } from './routes/demo/GccOverseasDemo'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<WorkerLogin />} />
      <Route
        path="/jobs"
        element={
          <WorkerRoute>
            <JobList />
          </WorkerRoute>
        }
      />
      <Route
        path="/jobs/:jobId"
        element={
          <WorkerRoute>
            <JobDetail />
          </WorkerRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <WorkerRoute>
            <MyApplications />
          </WorkerRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <WorkerRoute>
            <WorkerProfile />
          </WorkerRoute>
        }
      />

      <Route path="/employer/login" element={<EmployerLogin />} />
      <Route
        path="/employer"
        element={
          <EmployerRoute>
            <Dashboard />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/jobs/new"
        element={
          <EmployerRoute>
            <JobForm />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/jobs/:jobId"
        element={
          <EmployerRoute>
            <JobForm />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/jobs/:jobId/applicants"
        element={
          <EmployerRoute>
            <JobApplicants />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/workers"
        element={
          <EmployerRoute>
            <EmployerPortal />
          </EmployerRoute>
        }
      />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/documents"
        element={
          <AdminRoute>
            <DocumentReview />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <AdminRoute>
            <ApplicationReview />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/agents"
        element={
          <AdminRoute>
            <AgentManagement />
          </AdminRoute>
        }
      />
      <Route path="/agent/login" element={<AgentLogin />} />
      <Route
        path="/agent"
        element={
          <AgentRoute>
            <AgentPortal />
          </AgentRoute>
        }
      />
      <Route path="/demo/agent-app" element={<AgentAppDemo />} />
      <Route path="/demo/fraud-detection" element={<FraudDetectionDemo />} />
      <Route path="/demo/govt-dashboard" element={<GovtDashboardDemo />} />
      <Route path="/demo/ai-matching" element={<AiMatchingDemo />} />
      <Route path="/demo/gcc-overseas" element={<GccOverseasDemo />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
