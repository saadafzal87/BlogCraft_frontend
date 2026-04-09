import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { PostProvider } from './context/PostContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Blog from './pages/Blog';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostEditor from './pages/PostEditor';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PostProvider>
          <ErrorBoundary>
            <ToastContainer
              position="bottom-right"
              autoClose={2000}
              theme="colored"
              toastClassName="!min-h-[80px] !text-lg !font-medium !rounded-xl"
              hideProgressBar={false}
            />
            <Navbar />
            <main className="min-h-screen">
              <Routes>
                {/* Public */}
                <Route path="/" element={<Blog />} />
                <Route path="/blog/:id" element={<PostDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/posts/new"
                  element={
                    <ProtectedRoute>
                      <PostEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/posts/edit/:id"
                  element={
                    <ProtectedRoute>
                      <PostEditor />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </ErrorBoundary>
        </PostProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
