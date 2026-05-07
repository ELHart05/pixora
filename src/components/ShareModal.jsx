import { useEffect, useRef, useState } from 'react';
import {
  BsGlobe2, BsLockFill, BsClipboard2Check, BsShare,
  BsFillSaveFill, BsCheckLg, BsPeopleFill,
} from 'react-icons/bs';
import { trpc } from '../lib/trpc';
import { uploadToImgBB } from '../lib/imgbb';
import { useToast } from '../context/ToastContext';

/**
 * Two-tab modal:
 *   "Save"    — saves privately (goes to My Canvases, no share link)
 *   "Publish" — saves publicly and shows share link
 *
 * After a private save, the user may open the "Share with people" modal
 * to share the canvas with specific users.
 */
export function ShareModal({
  opened,
  onClose,
  getCanvasData,
  existingId,
  onSaved,
  initialTitle = '',
  initialDescription = '',
  initialVisibility = false,
  onSharePrivate,
}) {
  const utils = trpc.useUtils();
  const toast = useToast();

  const [tab, setTab] = useState('save'); // 'save' | 'publish'
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [savedTab, setSavedTab] = useState(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const saveDebounceRef = useRef(null);
  const wasOpenedRef = useRef(false);

  useEffect(() => {
    if (!opened) {
      wasOpenedRef.current = false;
      return;
    }

    if (wasOpenedRef.current) return;
    wasOpenedRef.current = true;

    setTab(initialVisibility ? 'publish' : 'save');
    setTitle(initialTitle);
    setDesc(initialDescription);
    setSavedId(null);
    setSavedTab(null);
    setCopied(false);
    setUploading(false);
    clearTimeout(saveDebounceRef.current);
  }, [opened, initialTitle, initialDescription, initialVisibility]);

  useEffect(() => {
    if (!opened) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [opened]);

  const saveMutation = trpc.canvas.save.useMutation({
    onSuccess: (data) => {
      const isPublicNow = tab === 'publish';
      const wasPublic = !!initialVisibility;
      const touchesPublicSurface = isPublicNow || wasPublic;
      const visibilityChanged = isPublicNow !== wasPublic;

      setSavedId(data.id);
      setSavedTab(tab);
      onSaved?.(data);
      utils.canvas.myList.invalidate();
      utils.canvas.byId.invalidate({ id: data.id });
      if (touchesPublicSurface) {
        utils.canvas.publicList.invalidate();
        utils.canvas.feed.invalidate();
      }
      if (visibilityChanged) {
        utils.user.topCreators.invalidate();
        utils.user.creatorsList.invalidate();
      }
      toast.success(tab === 'publish' ? 'Published to gallery!' : 'Canvas saved privately!');
    },
    onError: () => {
      toast.error('Failed to save canvas. Please try again.');
    },
  });

  async function runSave() {
    if (!title.trim()) return;
    const { json, thumbnail } = getCanvasData();
    const isPublic = tab === 'publish';

    let thumbnailUrl = undefined;
    if (thumbnail && isPublic) {
      try {
        setUploading(true);
        thumbnailUrl = await uploadToImgBB(thumbnail);
      } catch (err) {
        console.error('Thumbnail upload failed, saving without image:', err);
      } finally {
        setUploading(false);
      }
    }

    saveMutation.mutate({
      id: existingId ?? undefined,
      title: title.trim(),
      description: desc.trim() || undefined,
      data: json,
      thumbnail: thumbnailUrl,
      isPublic,
    });
  }

  function handleSave() {
    clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      runSave();
    }, 250);
  }

  function handleClose() {
    setTab(initialVisibility ? 'publish' : 'save');
    setTitle(initialTitle);
    setDesc(initialDescription);
    setSavedId(null);
    setSavedTab(null);
    setCopied(false);
    setUploading(false);
    clearTimeout(saveDebounceRef.current);
    onClose();
  }

  async function handleCopy() {
    const url = `${window.location.origin}/p/${savedId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!opened) return null;

  const shareUrl = savedId ? `${window.location.origin}/p/${savedId}` : null;
  const done = !!savedId;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#12141a] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/70"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="font-bold text-base">Save your canvas</h2>
          <button onClick={handleClose} className="text-white/30 hover:text-white transition-colors p-1">✕</button>
        </div>

        {!done ? (
          <div className="p-5 flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex rounded-xl border border-white/[0.08] overflow-hidden">
              <button
                onClick={() => setTab('save')}
                className={`flex items-center justify-center gap-2 flex-1 py-2.5 text-sm font-medium transition-all ${
                  tab === 'save'
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <BsFillSaveFill size={13} />
                Save privately
              </button>
              <button
                onClick={() => setTab('publish')}
                className={`flex items-center justify-center gap-2 flex-1 py-2.5 text-sm font-medium transition-all ${
                  tab === 'publish'
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <BsGlobe2 size={13} />
                Publish publicly
              </button>
            </div>

            <p className="text-xs text-white/35 -mt-1">
              {tab === 'save'
                ? 'Saved to your account only. Visible in "My Canvases". Not indexed or shared.'
                : 'Appears in the public gallery. Anyone with the link can view, like, and comment.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Give your canvas a name…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                Description
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Optional — describe what this is…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/60 transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!title.trim() || uploading || saveMutation.isPending}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                tab === 'publish'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 shadow-indigo-900/30'
                  : 'bg-white/10 hover:bg-white/15 shadow-black/20'
              }`}
            >
              {uploading
                ? 'Uploading preview…'
                : saveMutation.isPending
                ? 'Saving…'
                : tab === 'publish'
                ? 'Publish to gallery'
                : 'Save to my canvases'}
            </button>

            {saveMutation.isError && (
              <p className="text-red-400 text-xs text-center">Something went wrong. Please try again.</p>
            )}
          </div>
        ) : (
          <div className="p-5 flex flex-col items-center text-center gap-4 py-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              savedTab === 'publish'
                ? 'bg-indigo-500/15 border border-indigo-500/30'
                : 'bg-emerald-500/15 border border-emerald-500/30'
            }`}>
              {savedTab === 'publish'
                ? <BsShare size={22} className="text-indigo-400" />
                : <BsCheckLg size={22} className="text-emerald-400" />}
            </div>

            <div>
              <p className="font-bold text-lg">
                {savedTab === 'publish' ? 'Published!' : 'Saved!'}
              </p>
              <p className="text-white/45 text-sm mt-1">
                {savedTab === 'publish'
                  ? "It's live in the public gallery."
                  : 'Saved privately. Find it in My Canvases.'}
              </p>
            </div>

            {savedTab === 'publish' && shareUrl && (
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 truncate font-mono">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/8 border border-white/15 text-white/60 hover:bg-white/15'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}

            {/* Share with people button — shown for private saves */}
            {savedTab === 'save' && savedId && onSharePrivate && (
              <button
                onClick={() => {
                  handleClose();
                  onSharePrivate(savedId);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-semibold text-sm transition-all"
              >
                <BsPeopleFill size={14} />
                Share with specific people
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-medium text-sm transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
