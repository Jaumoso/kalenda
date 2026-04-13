import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import ToastContainer from './components/ToastContainer'
import OnboardingOverlay from './components/OnboardingOverlay'
import LoginPage from './pages/LoginPage'
import './App.css'

// Lazy-loaded pages
const AdminPage = lazy(() => import('./pages/AdminPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const MonthEditorPage = lazy(() => import('./pages/MonthEditorPage'))
const CoverEditorPage = lazy(() => import('./pages/CoverEditorPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const RenderMonthPage = lazy(() => import('./pages/RenderMonthPage'))
const RenderCoverPage = lazy(() => import('./pages/RenderCoverPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )
}

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isAuthenticated === null) {
    // Still checking auth
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public render routes for Puppeteer export */}
          <Route path="/render/:monthId" element={<RenderMonthPage />} />
          <Route path="/render-cover/:projectId" element={<RenderCoverPage />} />

          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/projects/:projectId/months/:monthId" element={<MonthEditorPage />} />
            <Route path="/projects/:projectId/cover/:type" element={<CoverEditorPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
      {isAuthenticated && <OnboardingOverlay />}
    </>
  )
}

export default App
