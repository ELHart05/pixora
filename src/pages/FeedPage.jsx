import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BsArrowRight,
  BsChatLeft,
  BsGridFill,
  BsHeart,
  BsPersonCircle,
  BsPencilFill,
  BsGlobe2,
  BsLockFill,
  BsClockHistory,
  BsTrash3Fill,
} from 'react-icons/bs';
import { trpc } from '../lib/trpc';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { SiteFooter, SiteNavbar } from '../components/SiteChrome';
import { CanvasDataPreview } from '../components/CanvasDataPreview';
import { HistoryPanel } from '../components/HistoryPanel';
import { stageEditorCanvasLoad } from '../lib/editorLoad';
import { useToast } from '../context/ToastContext';

function FeedCard({
  canvas,
  isOwner,
  onEdit,
  onTogglePublic,
  onViewHistory,
  onDelete,
  deleting,
  onConfirmDelete,
  onCancelDelete,
}) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/p/${canvas.id}`)}
      className="group text-left w-full bg-[#0f1117] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/15 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-pointer"
    >
      <div className="relative aspect-video bg-[#1a1d24] flex items-center justify-center overflow-hidden">
        {canvas.thumbnail ? (
          <img
            src={canvas.thumbnail}
            alt={canvas.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : canvas.data ? (
          <CanvasDataPreview data={canvas.data} title={canvas.title} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/15">
            <BsGridFill size={28} />
            <span className="text-xs">No preview</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {canvas.user?.username ? (
          <Link
            to={`/u/${canvas.user.username}`}
            className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {canvas.user.avatar ? (
              <img
                src={canvas.user.avatar}
                alt={canvas.user.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <BsPersonCircle size={16} className="text-white/30" />
            )}
            <span className="text-xs text-white/40 truncate hover:text-white/60 transition-colors">
              {canvas.user.name ?? canvas.user.username}
            </span>
          </Link>
        ) : null}

        <h3 className="font-semibold text-sm text-white truncate mb-1">{canvas.title}</h3>
        {canvas.description && (
          <p className="text-xs text-white/35 line-clamp-2 mb-3">{canvas.description}</p>
        )}

        <div className="flex items-center gap-3 text-white/30 text-xs">
          <span className="flex items-center gap-1">
            <BsHeart size={11} />
            {canvas._count?.likes ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <BsChatLeft size={11} />
            {canvas._count?.comments ?? 0}
          </span>
          <span className="ml-auto">
            {new Date(canvas.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {isOwner && (
          <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 text-xs font-semibold transition-all"
            >
              <BsPencilFill size={11} /> Edit
            </button>
            <button
              onClick={onTogglePublic}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 text-white/55 hover:bg-white/10 text-xs font-semibold transition-all"
              title={canvas.isPublic ? 'Make private' : 'Publish'}
            >
              {canvas.isPublic ? <BsLockFill size={11} /> : <BsGlobe2 size={11} />}
              {canvas.isPublic ? 'Private' : 'Publish'}
            </button>
            <button
              onClick={onViewHistory}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 text-white/55 hover:bg-white/10 text-xs font-semibold transition-all"
              title="View version history"
            >
              <BsClockHistory size={11} />
            </button>
            {deleting ? (
              <>
                <button
                  onClick={onConfirmDelete}
                  className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold transition-all"
                >
                  Confirm
                </button>
                <button
                  onClick={onCancelDelete}
                  className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 text-white/55 hover:bg-white/10 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 text-red-400/70 hover:bg-red-500/15 hover:text-red-400 text-xs font-semibold transition-all"
              >
                <BsTrash3Fill size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [historyCanvas, setHistoryCanvas] = useState(null);

  const feed = trpc.canvas.feed.useQuery(
    { page, limit: 12 },
    { enabled: !!user }
  );

  const togglePublic = trpc.canvas.togglePublic.useMutation({
    onSuccess: (result, variables) => {
      utils.canvas.feed.invalidate();
      utils.canvas.publicList.invalidate();
      utils.canvas.myList.invalidate();
      utils.canvas.byId.invalidate({ id: variables.id });
      const ownerUsername = feed.data?.items?.find((item) => item.id === variables.id)?.user?.username;
      if (ownerUsername) {
        utils.user.byUsername.invalidate({ username: ownerUsername });
      }
      utils.user.topCreators.invalidate();
      utils.user.creatorsList.invalidate();
      toast.success(result.isPublic ? 'Canvas published!' : 'Canvas set to private.');
    },
    onError: () => toast.error('Failed to update visibility.'),
  });

  const deleteCanvas = trpc.canvas.delete.useMutation({
    onSuccess: (_result, variables) => {
      utils.canvas.feed.invalidate();
      utils.canvas.publicList.invalidate();
      utils.canvas.myList.invalidate();
      utils.canvas.byId.invalidate({ id: variables.id });
      const ownerUsername = feed.data?.items?.find((item) => item.id === variables.id)?.user?.username;
      if (ownerUsername) {
        utils.user.byUsername.invalidate({ username: ownerUsername });
      }
      utils.user.topCreators.invalidate();
      utils.user.creatorsList.invalidate();
      setDeletingId(null);
      toast.success('Canvas deleted.');
    },
    onError: () => toast.error('Failed to delete canvas.'),
  });

  function openOwnedCanvasInEditor(canvas) {
    stageEditorCanvasLoad({
      data: canvas.data ?? '{}',
      id: canvas.id,
      title: canvas.title ?? '',
      description: canvas.description ?? '',
      isPublic: !!canvas.isPublic,
    });
    navigate('/editor');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-white/40">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col">
        <SiteNavbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-white/50">Sign in to see your feed</p>
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
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-sans overflow-x-hidden flex flex-col">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-3xl" />
      </div>

      <SiteNavbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Your feed
          </h1>
          <p className="text-white/45 text-sm sm:text-base">
            Recent public canvases from people you follow, plus your own public work.
          </p>
        </div>

        {feed.isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-white/[0.04]" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {feed.data && feed.data.items.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <BsGridFill size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Your feed is quiet right now.</p>
            <p className="text-sm mb-6">Follow a few creators to start seeing their public canvases here.</p>
            <Link
              to="/creators"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:from-indigo-400 hover:to-violet-400 transition-all"
            >
              Browse creators <BsArrowRight size={14} />
            </Link>
          </div>
        )}

        {feed.data && feed.data.items.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {feed.data.items.map((canvas) => (
                <FeedCard
                  key={canvas.id}
                  canvas={canvas}
                  isOwner={user?.id === canvas.user?.id}
                  onEdit={() => openOwnedCanvasInEditor(canvas)}
                  onTogglePublic={() => togglePublic.mutate({ id: canvas.id })}
                  onViewHistory={() => setHistoryCanvas(canvas)}
                  onDelete={() => setDeletingId(canvas.id)}
                  deleting={deletingId === canvas.id}
                  onConfirmDelete={() => deleteCanvas.mutate({ id: canvas.id })}
                  onCancelDelete={() => setDeletingId(null)}
                />
              ))}
            </div>

            {feed.data.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="text-sm text-white/30 px-2">
                  Page {page} of {feed.data.pages}
                </span>
                <button
                  disabled={page === feed.data.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />

      {historyCanvas && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setHistoryCanvas(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <HistoryPanel
              canvasId={historyCanvas.id}
              ownerUsername={historyCanvas.user?.username ?? undefined}
              onClose={() => setHistoryCanvas(null)}
              onRestore={(data) => {
                stageEditorCanvasLoad({
                  data,
                  id: historyCanvas.id,
                  title: historyCanvas.title ?? '',
                  description: historyCanvas.description ?? '',
                  isPublic: !!historyCanvas.isPublic,
                });
                setHistoryCanvas(null);
                navigate('/editor');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
