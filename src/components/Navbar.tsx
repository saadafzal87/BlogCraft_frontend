import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, user } = useAuthContext();
  const { logoutAndRedirect } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center
                            group-hover:bg-indigo-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg">BlogCraft</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated && (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `btn-ghost text-sm ${isActive ? 'text-indigo-400 bg-indigo-500/10' : ''}`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/posts/new"
                  className={({ isActive }) =>
                    `btn-ghost text-sm ${isActive ? 'text-indigo-400 bg-indigo-500/10' : ''}`
                  }
                >
                  New Post
                </NavLink>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-300">{user?.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${user?.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                    {user?.role}
                  </span>
                </div>
                <button onClick={logoutAndRedirect} className="btn-ghost text-sm text-red-400 hover:text-red-300">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-700/50 bg-slate-900 px-4 py-3 space-y-1">
          <NavLink to="/" className="block btn-ghost text-sm" onClick={() => setMenuOpen(false)}>Blog</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className="block btn-ghost text-sm" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
              <NavLink to="/posts/new" className="block btn-ghost text-sm" onClick={() => setMenuOpen(false)}>New Post</NavLink>
              <button onClick={() => { logoutAndRedirect(); setMenuOpen(false); }}
                className="block w-full text-left btn-ghost text-sm text-red-400">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="block btn-ghost text-sm" onClick={() => setMenuOpen(false)}>Login</NavLink>
              <NavLink to="/register" className="block btn-ghost text-sm" onClick={() => setMenuOpen(false)}>Register</NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
