import { useEffect } from 'react';
import { BsGithub } from 'react-icons/bs';
import { FcGoogle } from 'react-icons/fc';
import { BsPencilFill } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';

/**
 * Modal shown when the user needs to sign in.
 * Uses a plain div overlay (no Mantine Modal) to stay consistent with the dark theme.
 */
export function AuthModal({ opened, onClose }) {
  const { signInWithGitHub, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!opened) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [opened]);

  if (!opened) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#12141a] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/70 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BsPencilFill size={14} />
          </div>
          <span className="font-bold text-lg tracking-tight">Pixora</span>
        </div>

        <h2 className="text-xl font-bold mb-1">Sign in to continue</h2>
        <p className="text-white/45 text-sm mb-6 leading-relaxed">
          Sign in to save your canvases to the cloud, share them publicly, and like or comment on
          others.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { signInWithGitHub(); onClose(); }}
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-medium text-sm"
          >
            <BsGithub size={18} />
            Continue with GitHub
          </button>

          <button
            onClick={() => { signInWithGoogle(); onClose(); }}
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-medium text-sm"
          >
            <FcGoogle size={18} />
            Continue with Google
          </button>
        </div>

        <p className="text-center text-white/25 text-xs mt-5">
          By signing in you agree to our terms of service.
        </p>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
