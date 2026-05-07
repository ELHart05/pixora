import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BsGlobe2, BsLockFill, BsPencilFill, BsTrash3Fill,
  BsPeopleFill, BsEye, BsHeartFill, BsChatFill,
  BsGridFill, BsPersonCircle, BsClockHistory,
} from 'react-icons/bs';
import { MdOutlineAddToPhotos } from 'react-icons/md';
import { trpc } from '../lib/trpc';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { SharePrivateModal } from '../components/SharePrivateModal';
import { HistoryPanel } from '../components/HistoryPanel';
import { useToast } from '../context/ToastContext';
import { SiteFooter, SiteNavbar } from '../components/SiteChrome';
import { CanvasDataPreview } from '../components/CanvasDataPreview';
import { stageEditorCanvasLoad } from '../lib/editorLoad';

export default function MyCanvasesPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const toast = useToast();

  const [tab, setTab] = useState('mine'); // 'mine' | 'shared'
  const [shareTarget, setShareTarget] = useState(null); // canvas being configured for sharing
  const [authOpen, setAuthOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [historyCanvasId, setHistoryCanvasId] = useState(null); // canvas whose history to show

  const myList = trpc.canvas.myList.useQuery(undefined, { enabled: !!user });
  const sharedWithMe = trpc.canvas.sharedWithMe.useQuery(undefined, { enabled: !!user });

  const togglePublicMutation = trpc.canvas.togglePublic.useMutation({
    onSuccess: (data, variables) => {
      utils.canvas.myList.invalidate();
      utils.canvas.publicList.invalidate();
      utils.canvas.feed.invalidate();
      utils.canvas.byId.invalidate({ id: variables.id });
      if (user?.username) {
        utils.user.byUsername.invalidate({ username: user.username });
      }
      utils.user.topCreators.invalidate();
      utils.user.creatorsList.invalidate();
      toast.success(data.isPublic ? 'Canvas published!' : 'Canvas set to private.');
    },
    onError: () => toast.error('Failed to update visibility.'),
  });

  const deleteMutation = trpc.canvas.delete.useMutation({
    onSuccess: (_result, variables) => {
      utils.canvas.myList.invalidate();
      utils.canvas.byId.invalidate({ id: variables.id });
      if (user?.username) {
        utils.user.byUsername.invalidate({ username: user.username });
      }
      const deletedCanvas = (myList.data ?? []).find((item) => item.id === variables.id);
      if (deletedCanvas?.isPublic) {
        utils.canvas.publicList.invalidate();
        utils.canvas.feed.invalidate();
        utils.user.topCreators.invalidate();
        utils.user.creatorsList.invalidate();
      }
      setDeletingId(null);
      toast.success('Canvas deleted.');
    },
    onError: () => toast.error('Failed to delete canvas.'),
  });

  function openInEditor(canvas, isOwnedCanvas) {
    stageEditorCanvasLoad({
      data: canvas.data ?? '{}',
      id: isOwnedCanvas ? canvas.id : null,
      title: canvas.title ?? '',
      description: canvas.description ?? '',
      isPublic: !!canvas.isPublic,
    });
    navigate('/editor');
  }

  if (authLoading) return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-white/40">
      Loading…
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col">
      <SiteNavbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/50">Sign in to see your canvases</p>
        <button
          onClick={() => setAuthOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-semibold text-sm transition-all"
        >
          Sign in
        </button>
      </div>
      <AuthModal opened={authOpen} onClose={() => setAuthOpen(false)} />
      <SiteFooter />
    </div>
  );

  const canvases = tab === 'mine' ? myList.data ?? [] : sharedWithMe.data ?? [];
  const loading = tab === 'mine' ? myList.isLoading : sharedWithMe.isLoading;

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col">
      <SiteNavbar />

      <div className="flex-1 max-w-6xl mx-auto px-4 pt-24 pb-12 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Canvases</h1>
            <p className="text-white/40 text-sm mt-1">Your saved and published work</p>
          </div>
          <button
            onClick={() => navigate('/editor')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-semibold text-sm transition-all self-start sm:self-auto"
          >
            <MdOutlineAddToPhotos size={16} />
            New canvas
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/[0.07] pb-4">
          {[
            { key: 'mine', label: 'My work', icon: <BsGridFill size={13} /> },
            { key: 'shared', label: 'Shared with me', icon: <BsPeopleFill size={13} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-white/30 text-sm py-20 text-center">Loading…</div>
        ) : canvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/30">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <BsGridFill size={28} />
            </div>
            <div className="text-center">
              <p className="font-medium">
                {tab === 'mine' ? 'No canvases yet' : 'Nothing shared with you yet'}
              </p>
              <p className="text-sm mt-1">
                {tab === 'mine' ? 'Create your first canvas in the editor.' : 'When someone shares a canvas with you, it appears here.'}
              </p>
            </div>
            {tab === 'mine' && (
              <button
                onClick={() => navigate('/editor')}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-sm font-medium transition-all"
              >
                Open editor
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {canvases.map((canvas) => (
              <CanvasCard
                key={canvas.id}
                canvas={canvas}
                isMine={tab === 'mine'}
                onEdit={() => openInEditor(canvas, tab === 'mine')}
                onTogglePublic={() => togglePublicMutation.mutate({ id: canvas.id })}
                onShare={() => setShareTarget(canvas)}
                onDelete={() => setDeletingId(canvas.id)}
                deleting={deletingId === canvas.id}
                onConfirmDelete={() => deleteMutation.mutate({ id: canvas.id })}
                onCancelDelete={() => setDeletingId(null)}
                onViewHistory={() => setHistoryCanvasId(canvas.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Share-with-person modal */}
      {shareTarget && (
        <SharePrivateModal
          opened={!!shareTarget}
          onClose={() => setShareTarget(null)}
          canvasId={shareTarget.id}
          currentShares={shareTarget.shares ?? []}
        />
      )}

      {/* History panel overlay */}
      {historyCanvasId && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setHistoryCanvasId(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <HistoryPanel
              canvasId={historyCanvasId}
              ownerUsername={user?.username ?? undefined}
              onClose={() => setHistoryCanvasId(null)}
              onRestore={(data) => {
                // Navigate to editor with the restored version
                const canvas = (myList.data ?? []).find((c) => c.id === historyCanvasId);
                stageEditorCanvasLoad({
                  data,
                  id: canvas?.id ?? null,
                  title: canvas?.title ?? '',
                  description: canvas?.description ?? '',
                  isPublic: !!canvas?.isPublic,
                });
                setHistoryCanvasId(null);
                navigate('/editor');
              }}
            />
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}

function CanvasCard({
  canvas, isMine,
  onEdit, onTogglePublic, onShare, onDelete,
  deleting, onConfirmDelete, onCancelDelete,
  onViewHistory,
}) {
  return (
    <div className="group relative bg-[#12141a] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/15 transition-all">
      {/* Thumbnail */}
      <div className="aspect-video bg-[#1e2128] relative overflow-hidden">
        {canvas.thumbnail ? (
          <img src={canvas.thumbnail} alt={canvas.title} className="w-full h-full object-cover" />
        ) : canvas.data ? (
          <CanvasDataPreview data={canvas.data} title={canvas.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl">✦</div>
        )}
        {/* Visibility badge */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          canvas.isPublic
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            : 'bg-black/60 text-white/40 border border-white/10'
        }`}>
          {canvas.isPublic ? <BsGlobe2 size={10} /> : <BsLockFill size={10} />}
          {canvas.isPublic ? 'Public' : 'Private'}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-snug line-clamp-1">{canvas.title}</h3>
        </div>
        {canvas.description && (
          <p className="text-white/35 text-xs line-clamp-2 mb-2">{canvas.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-white/30 text-xs mb-3">
          <span className="flex items-center gap-1">
            <BsHeartFill size={10} />{canvas._count?.likes ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <BsChatFill size={10} />{canvas._count?.comments ?? 0}
          </span>
          {!isMine && canvas.user && (
            <Link
              to={canvas.user.username ? `/u/${canvas.user.username}` : '#'}
              className="flex items-center gap-1 hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {canvas.user.avatar ? (
                <img src={canvas.user.avatar} alt="" className="w-4 h-4 rounded-full" />
              ) : (
                <BsPersonCircle size={10} />
              )}
              {canvas.user.name ?? canvas.user.username ?? 'Unknown'}
            </Link>
          )}
        </div>

        {/* Shared-with avatars (mine only) */}
        {isMine && canvas.shares && canvas.shares.length > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <BsPeopleFill size={11} className="text-white/30" />
            <span className="text-xs text-white/30">
              Shared with {canvas.shares.length} person{canvas.shares.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Actions */}
        {deleting ? (
          <div className="flex gap-2">
            <button
              onClick={onConfirmDelete}
              className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-all"
            >
              Confirm delete
            </button>
            <button
              onClick={onCancelDelete}
              className="flex-1 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs font-semibold hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 text-xs font-semibold transition-all"
            >
              <BsPencilFill size={11} /> {isMine ? 'Edit' : 'Open copy'}
            </button>
            {isMine && (
              <>
                <button
                  onClick={onTogglePublic}
                  className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 text-xs font-semibold transition-all"
                  title={canvas.isPublic ? 'Make private' : 'Make public'}
                >
                  {canvas.isPublic ? <BsLockFill size={11} /> : <BsGlobe2 size={11} />}
                  {canvas.isPublic ? 'Make private' : 'Publish'}
                </button>
                <button
                  onClick={onShare}
                  className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 text-xs font-semibold transition-all"
                  title="Share with specific people"
                >
                  <BsPeopleFill size={11} /> Share
                </button>
                <button
                  onClick={onViewHistory}
                  className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 text-xs font-semibold transition-all"
                  title="View version history"
                >
                  <BsClockHistory size={11} />
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 text-red-400/60 hover:bg-red-500/15 hover:text-red-400 text-xs font-semibold transition-all"
                >
                  <BsTrash3Fill size={11} />
                </button>
              </>
            )}
            {!isMine && (
              <Link
                to={`/p/${canvas.id}`}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 text-xs font-semibold transition-all"
              >
                <BsEye size={11} /> View
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
