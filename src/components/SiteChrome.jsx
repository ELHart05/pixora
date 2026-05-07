import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BsArrowRight,
  BsCollection,
  BsGithub,
  BsGridFill,
  BsList,
  BsPeopleFill,
  BsPencilFill,
  BsPersonCircle,
  BsX,
} from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

const GITHUB_URL = 'https://github.com/ELHart05/pixora';

export function SiteNavbar({ maxWidth = 'max-w-6xl', actions = null, showEditorButton = true }) {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const handleOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [profileMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#07090e]/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3`}>
          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0 hover:opacity-85 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <BsPencilFill size={13} />
            </div>
            <span className="font-bold tracking-tight truncate">Pixora</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/gallery"
              className="hidden sm:flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium px-2 py-1 rounded-md transition-colors"
            >
              <BsGridFill size={13} />
              Gallery
            </Link>
            {user && (
              <Link
                to="/feed"
                className="hidden sm:flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium px-2 py-1 rounded-md transition-colors"
              >
                <BsCollection size={13} />
                Feed
              </Link>
            )}
            <Link
              to="/creators"
              className="hidden sm:flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium px-2 py-1 rounded-md transition-colors"
            >
              <BsPeopleFill size={13} />
              Creators
            </Link>

            {actions}

            {!authLoading && (
              user ? (
                <div className="flex items-center gap-2">
                  {showEditorButton && (
                    <button
                      onClick={() => navigate('/editor')}
                      className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-900/35 whitespace-nowrap"
                    >
                      Open editor <BsArrowRight size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Open navigation menu"
                  >
                    <BsList size={18} />
                  </button>
                  <div className="relative hidden sm:block" ref={profileMenuRef}>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((open) => !open)}
                      className="flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                      aria-label="Open profile menu"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-white/10 cursor-pointer" />
                      ) : (
                        <BsPersonCircle size={26} className="text-white/40 cursor-pointer" />
                      )}
                    </button>
                    {profileMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-[#1e2128] border border-white/10 rounded-lg shadow-xl z-50 min-w-[150px] overflow-hidden">
                      <div className="px-3 py-2 border-b border-white/[0.06] text-xs text-white/50 truncate">{user.name}</div>
                      {user.username && (
                        <Link to={`/u/${user.username}`} onClick={() => setProfileMenuOpen(false)} className="block px-3 py-2 text-xs text-white/60 hover:bg-white/8 hover:text-white transition-colors">My Profile</Link>
                      )}
                      <Link to="/my-canvases" onClick={() => setProfileMenuOpen(false)} className="block px-3 py-2 text-xs text-white/60 hover:bg-white/8 hover:text-white transition-colors">My Canvases</Link>
                      <Link to="/settings/profile" onClick={() => setProfileMenuOpen(false)} className="block px-3 py-2 text-xs text-white/60 hover:bg-white/8 hover:text-white transition-colors">Settings</Link>
                      <div className="border-t border-white/[0.06]" />
                      <button onClick={() => { setProfileMenuOpen(false); signOut(); }} className="w-full text-left px-3 py-2 text-xs text-white/60 hover:bg-white/8 hover:text-white transition-colors">Sign out</button>
                    </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-all whitespace-nowrap"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Open navigation menu"
                  >
                    <BsList size={18} />
                  </button>
                </>
              )
            )}

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block text-white/35 hover:text-white transition-colors p-1"
              aria-label="GitHub"
            >
              <BsGithub size={17} />
            </a>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-[70]" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
          <div
            className="absolute inset-y-0 right-0 w-[min(86vw,320px)] bg-[#11131a] border-l border-white/[0.08] shadow-2xl p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                  <BsPencilFill size={14} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">Pixora</p>
                  <p className="text-[11px] text-white/35 truncate">{user?.name ?? 'Navigation'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close navigation menu"
              >
                <BsX size={16} className="mx-auto" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/75 hover:bg-white/[0.06] transition-colors">
                Gallery
              </Link>
              {user && (
                <Link to="/feed" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/75 hover:bg-white/[0.06] transition-colors">
                  Feed
                </Link>
              )}
              <Link to="/creators" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/75 hover:bg-white/[0.06] transition-colors">
                Creators
              </Link>
              {user && showEditorButton && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/editor');
                  }}
                  className="px-3 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-sm text-indigo-300 text-left hover:bg-indigo-500/25 transition-colors"
                >
                  Open editor
                </button>
              )}
              {user ? (
                <>
                  {user.username && (
                    <Link to={`/u/${user.username}`} onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/75 hover:bg-white/[0.06] transition-colors">
                      My Profile
                    </Link>
                  )}
                  <Link to="/my-canvases" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/75 hover:bg-white/[0.06] transition-colors">
                    My Canvases
                  </Link>
                  <Link to="/settings/profile" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/75 hover:bg-white/[0.06] transition-colors">
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/75 text-left hover:bg-white/[0.06] transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthOpen(true);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/75 text-left hover:bg-white/[0.06] transition-colors"
                >
                  Sign in
                </button>
              )}
            </div>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-sm text-white/55 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <BsGithub size={14} /> View on GitHub
            </a>
          </div>
        </div>
      )}

      <AuthModal opened={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export function SiteFooter({ maxWidth = 'max-w-6xl' }) {
  return (
    <footer className="mt-auto border-t border-white/[0.05] py-6 sm:py-8 px-4 sm:px-6">
      <div className={`${maxWidth} mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-0 sm:justify-between text-xs text-white/30`}>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
            <BsPencilFill size={9} />
          </div>
          <span className="font-semibold text-white/40">Pixora</span>
          <span className="text-white/15">·</span>
          <span>Free, open-source canvas tool</span>
          <span className="text-white/15">·</span>
          <span>Made by Okba Allaoua</span>
        </div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-white/60 transition-colors shrink-0 whitespace-nowrap"
        >
          <BsGithub size={13} /> View on GitHub
        </a>
      </div>
    </footer>
  );
}
