import { Switch, Route, Redirect } from 'wouter'
import { LoginPage } from './pages/LoginPage'
import { PendingActivationPage } from './pages/PendingActivationPage'
import { DashboardPage } from './pages/DashboardPage'
import { ReviewListPage } from './pages/ReviewListPage'
import { ReviewEditorPage } from './pages/ReviewEditorPage'
import { TemplateListPage } from './pages/TemplateListPage'
import { TemplateEditorPage } from './pages/TemplateEditorPage'
import { CheckinPage } from './pages/CheckinPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { InstructorListPage } from './pages/InstructorListPage'
import { CompliancePage } from './pages/CompliancePage'
import { VolunteerHoursPage } from './pages/VolunteerHoursPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminLayout } from './components/AdminLayout'

function App() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/pending-activation" component={PendingActivationPage} />
      <Route path="/dashboard">
        <ProtectedRoute role="instructor">
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/reviews">
        <ProtectedRoute role="instructor">
          <ReviewListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/reviews/:id">
        <ProtectedRoute role="instructor">
          <ReviewEditorPage />
        </ProtectedRoute>
      </Route>
      <Route path="/templates">
        <ProtectedRoute role="instructor">
          <TemplateListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/templates/new">
        <ProtectedRoute role="instructor">
          <TemplateEditorPage />
        </ProtectedRoute>
      </Route>
      <Route path="/templates/:id">
        <ProtectedRoute role="instructor">
          <TemplateEditorPage />
        </ProtectedRoute>
      </Route>
      <Route path="/checkin">
        <ProtectedRoute role="instructor">
          <CheckinPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/instructors">
        <ProtectedRoute role="admin">
          <AdminLayout>
            <InstructorListPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/compliance">
        <ProtectedRoute role="admin">
          <AdminLayout>
            <CompliancePage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/volunteer-hours">
        <ProtectedRoute role="admin">
          <AdminLayout>
            <VolunteerHoursPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute role="admin">
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFoundPage} />
    </Switch>
  )
}

export default App
