import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BsHeart,
  BsHeartFill,
  BsChatLeft,
  BsArrowLeft,
  BsPersonCircle,
  BsTrash,
  BsBoxArrowUpRight,
  BsGlobe2,
  BsLockFill,
  BsReply,
  BsPeople,
  BsPencilFill,
  BsClockHistory,
} from 'react-icons/bs';
import { trpc } from '../lib/trpc';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { useToast } from '../context/ToastContext';
import { SiteFooter, SiteNavbar } from '../components/SiteChrome';
import { CanvasDataPreview } from '../components/CanvasDataPreview';
import { stageEditorCanvasLoad } from '../lib/editorLoad';
import { HistoryPanel } from '../components/HistoryPanel';

function CommentBody({ comment, canvasOwnerId, onDelete, onReply, canReply = true }) {
  const { user } = useAuth();
  const canDelete = user && (user.id === comment.userId || user.id === canvasOwnerId);

  return (
    <div className="flex gap-3 py-4">
      {comment.user?.avatar ? (
        <img
          src={comment.user.avatar}
          alt={comment.user.name}
          className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
        />
      ) : (
        <BsPersonCircle size={28} className="text-white/25 shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          {comment.user?.username ? (
            <Link
              to={`/u/${comment.user.username}`}
              className="text-xs font-semibold text-white/60 truncate hover:text-white/80 transition-colors"
            >
              {comment.user.name ?? comment.user.username}
            </Link>
          ) : (
            <span className="text-xs font-semibold text-white/60 truncate">
              {comment.user?.name ?? 'Anonymous'}
            </span>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/25">
              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-white/20 hover:text-red-400 transition-colors p-0.5"
                aria-label="Delete comment"
              >
                <BsTrash size={12} />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-white/75 break-words leading-relaxed">{comment.text}</p>
        {canReply && (
          <button
            onClick={() => onReply(comment)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-white/30 hover:text-indigo-300 transition-colors"
          >
            <BsReply size={13} />
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

function RepliesList({ canvasId, parent, canvasOwnerId, onDelete, onReply }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const repliesQuery = trpc.social.replies.useQuery(
    { canvasId, parentId: parent.id, page, limit: 5 },
    { enabled: expanded }
  );

  const replies = expanded ? repliesQuery.data?.items ?? [] : parent.replies ?? [];
  const pages = repliesQuery.data?.pages ?? 1;
  const remaining = Math.max(0, (parent.replyCount ?? 0) - (parent.replies?.length ?? 0));

  if ((parent.replyCount ?? 0) === 0) return null;

  return (
    <div className="ml-10 border-l border-white/[0.07] pl-4">
      {replies.map((reply) => (
        <CommentBody
          key={reply.id}
          comment={reply}
          canvasOwnerId={canvasOwnerId}
          onDelete={onDelete}
          onReply={onReply}
          canReply={false}
        />
      ))}
      {!expanded && remaining > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mb-3 text-xs font-medium text-indigo-300/80 hover:text-indigo-200 transition-colors"
        >
          View {remaining} more repl{remaining === 1 ? 'y' : 'ies'}
        </button>
      )}
      {expanded && pages > 1 && (
        <div className="flex items-center gap-2 pb-3 text-xs text-white/30">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
          >
            Previous replies
          </button>
          <span>Page {page} of {pages}</span>
          <button
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
          >
            Next replies
          </button>
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, canvasId, canvasOwnerId, onDelete, onReply }) {
  return (
    <div className="border-b border-white/[0.06]">
      <CommentBody
        comment={comment}
        canvasOwnerId={canvasOwnerId}
        onDelete={onDelete}
        onReply={onReply}
      />
      <RepliesList
        canvasId={canvasId}
        parent={comment}
        canvasOwnerId={canvasOwnerId}
        onDelete={onDelete}
        onReply={onReply}
      />
    </div>
  );
}

function LikesModal({ opened, canvasId, page, setPage, onClose }) {
  const likes = trpc.social.likes.useQuery(
    { canvasId, page, limit: 12 },
    { enabled: opened && !!canvasId }
  );

  if (!opened) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#12141a] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="font-bold text-sm">Liked by</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white">x</button>
        </div>
        <div className="p-4 min-h-[220px]">
          {likes.isLoading ? (
            <p className="text-sm text-white/30 py-8 text-center">Loading...</p>
          ) : !likes.data?.items?.length ? (
            <p className="text-sm text-white/30 py-8 text-center">No likes yet.</p>
          ) : (
            <div className="space-y-2">
              {likes.data.items.map((like) => (
                <Link
                  key={like.id}
                  to={like.user.username ? `/u/${like.user.username}` : '#'}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.05] transition-colors"
                  onClick={onClose}
                >
                  {like.user.avatar ? (
                    <img src={like.user.avatar} alt={like.user.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  ) : (
                    <BsPersonCircle size={30} className="text-white/25" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/75 truncate">{like.user.name ?? like.user.username ?? 'User'}</p>
                    {like.user.username && <p className="text-xs text-white/30 truncate">@{like.user.username}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        {(likes.data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-white/[0.07] text-xs text-white/30">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">Previous</button>
            <span>Page {page} of {likes.data.pages}</span>
            <button disabled={page === likes.data.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CanvasViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const toast = useToast();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPage, setCommentPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [likesOpen, setLikesOpen] = useState(false);
  const [likesPage, setLikesPage] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: canvas, isLoading, isError } = trpc.canvas.byId.useQuery({ id }, { enabled: !!id });
  const { data: likeData } = trpc.social.likeStatus.useQuery({ canvasId: id }, { enabled: !!id });
  const { data: commentsData } = trpc.social.comments.useQuery(
    { canvasId: id, page: commentPage, limit: 6, repliesLimit: 3 },
    { enabled: !!id }
  );
  const ownerUsername = canvas?.user?.username;

  function invalidateOwnerProfile() {
    if (ownerUsername) {
      utils.user.byUsername.invalidate({ username: ownerUsername });
    }
  }

  const toggleLike = trpc.social.toggleLike.useMutation({
    onSuccess: () => {
      utils.social.likeStatus.invalidate({ canvasId: id });
      utils.social.likes.invalidate({ canvasId: id });
      utils.canvas.byId.invalidate({ id });
      if (canvas?.isPublic) {
        utils.canvas.feed.invalidate();
        utils.canvas.publicList.invalidate();
      }
      invalidateOwnerProfile();
    },
  });

  const addComment = trpc.social.addComment.useMutation({
    onSuccess: () => {
      setCommentText('');
      setReplyText('');
      setReplyingTo(null);
      utils.social.comments.invalidate({ canvasId: id });
      utils.social.replies.invalidate();
      utils.canvas.byId.invalidate({ id });
      if (canvas?.isPublic) {
        utils.canvas.feed.invalidate();
        utils.canvas.publicList.invalidate();
      }
      invalidateOwnerProfile();
      toast.success('Comment posted!');
    },
    onError: () => toast.error('Failed to post comment.'),
  });

  const deleteComment = trpc.social.deleteComment.useMutation({
    onSuccess: () => {
      utils.social.comments.invalidate({ canvasId: id });
      utils.social.replies.invalidate();
      utils.canvas.byId.invalidate({ id });
      if (canvas?.isPublic) {
        utils.canvas.feed.invalidate();
        utils.canvas.publicList.invalidate();
      }
      invalidateOwnerProfile();
      toast.info('Comment deleted.');
    },
  });

  const tryThis = trpc.canvas.tryThis.useMutation({
    onSuccess: (copy) => {
      utils.canvas.myList.invalidate();
      loadCanvasInEditor({
        data: copy.data,
        id: copy.id,
        title: copy.title,
        description: copy.description,
        isPublic: copy.isPublic,
      });
      toast.success('Copied to your canvases.');
    },
    onError: () => {
      toast.info('Opening an editable local copy.');
      openInEditor();
    },
  });

  const togglePublic = trpc.canvas.togglePublic.useMutation({
    onSuccess: (result) => {
      utils.canvas.byId.invalidate({ id });
      utils.canvas.myList.invalidate();
      utils.canvas.publicList.invalidate();
      utils.canvas.feed.invalidate();
      invalidateOwnerProfile();
      utils.user.topCreators.invalidate();
      utils.user.creatorsList.invalidate();
      toast.success(result.isPublic ? 'Canvas published!' : 'Canvas set to private.');
    },
    onError: () => toast.error('Failed to update visibility.'),
  });

  const deleteCanvas = trpc.canvas.delete.useMutation({
    onSuccess: () => {
      utils.canvas.byId.invalidate({ id });
      utils.canvas.myList.invalidate();
      if (canvas?.isPublic) {
        utils.canvas.publicList.invalidate();
        utils.canvas.feed.invalidate();
        utils.user.topCreators.invalidate();
        utils.user.creatorsList.invalidate();
      }
      invalidateOwnerProfile();
      toast.success('Canvas deleted.');
      navigate('/my-canvases');
    },
    onError: () => toast.error('Failed to delete canvas.'),
  });

  function loadCanvasInEditor({ data, id: canvasId = null, title, description, isPublic = false }) {
    if (!data) return;
    stageEditorCanvasLoad({
      data,
      id: canvasId,
      title: title ?? '',
      description: description ?? '',
      isPublic,
    });
    navigate('/editor');
  }

  function requireAuth() {
    if (!user) {
      setAuthModalOpen(true);
      return false;
    }
    return true;
  }

  function handleLike() {
    if (!requireAuth()) return;
    toggleLike.mutate({ canvasId: id });
  }

  function handleAddComment(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!commentText.trim()) return;
    addComment.mutate({ canvasId: id, text: commentText.trim() });
  }

  function handleAddReply(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!replyingTo || !replyText.trim()) return;
    addComment.mutate({ canvasId: id, parentId: replyingTo.id, text: replyText.trim() });
  }

  function openInEditor(asOwner = false) {
    if (!canvas?.data) return;
    loadCanvasInEditor({
      data: canvas.data,
      id: asOwner ? canvas.id : null,
      title: canvas.title ?? '',
      description: canvas.description ?? '',
      isPublic: asOwner ? !!canvas.isPublic : false,
    });
  }

  function handleTryThis() {
    if (!canvas?.data) return;
    if (!user) {
      openInEditor();
      return;
    }
    tryThis.mutate({ id });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin" />
      </div>
    );
  }

  if (isError || !canvas) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center gap-4 text-white/40 px-4">
        <BsLockFill size={40} className="opacity-30" />
        <p className="text-lg font-semibold">Canvas not found or private</p>
        <p className="text-sm text-center max-w-xs">
          This canvas may be private or the link may be incorrect.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <BsArrowLeft size={14} /> Go home
        </button>
      </div>
    );
  }

  const liked = likeData?.liked ?? false;
  const likeCount = likeData?.count ?? 0;
  const isOwner = user?.id === canvas.userId;

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-sans overflow-x-hidden flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-violet-600/4 blur-3xl" />
      </div>

      <SiteNavbar
        maxWidth="max-w-4xl"
        showEditorButton={false}
        actions={(
          <button
            onClick={() => navigate(-1)}
            className="hidden sm:flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            <BsArrowLeft size={16} />
            Back
          </button>
        )}
      />

      {/* Main content */}
      <main className="flex-1 pt-20 pb-16 max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{canvas.title}</h1>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  canvas.isPublic
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white/30'
                }`}
              >
                {canvas.isPublic ? <BsGlobe2 size={11} /> : <BsLockFill size={11} />}
                {canvas.isPublic ? 'Public' : 'Private'}
              </span>
              {!isOwner && (
                <button
                  onClick={handleTryThis}
                  disabled={tryThis.isLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  <BsBoxArrowUpRight size={12} />
                  {tryThis.isLoading ? 'Copying...' : 'Try this'}
                </button>
              )}
              {isOwner ? (
                <>
                  <button
                    onClick={() => openInEditor(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-all whitespace-nowrap"
                  >
                    <BsPencilFill size={11} />
                    Edit
                  </button>
                  <button
                    onClick={() => togglePublic.mutate({ id: canvas.id })}
                    disabled={togglePublic.isPending}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/55 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap disabled:opacity-50"
                  >
                    {canvas.isPublic ? <BsLockFill size={11} /> : <BsGlobe2 size={11} />}
                    {canvas.isPublic ? 'Make private' : 'Publish'}
                  </button>
                  <button
                    onClick={() => setHistoryOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/55 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
                  >
                    <BsClockHistory size={11} />
                    History
                  </button>
                  {confirmDelete ? (
                    <>
                      <button
                        onClick={() => deleteCanvas.mutate({ id: canvas.id })}
                        disabled={deleteCanvas.isPending}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all whitespace-nowrap disabled:opacity-50"
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/55 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-red-400/70 hover:bg-red-500/15 hover:text-red-400 transition-all whitespace-nowrap"
                    >
                      <BsTrash size={11} />
                      Delete
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => openInEditor(false)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/55 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
                >
                  Open copy
                </button>
              )}
            </div>
          </div>

          {/* Author — clickable link to profile */}
          <div className="flex items-center gap-2 text-sm text-white/40 mb-2">
            {canvas.user?.username ? (
              <Link
                to={`/u/${canvas.user.username}`}
                className="flex items-center gap-2 hover:text-white/60 transition-colors"
              >
                {canvas.user.avatar ? (
                  <img
                    src={canvas.user.avatar}
                    alt={canvas.user.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <BsPersonCircle size={16} />
                )}
                <span>{canvas.user.name ?? canvas.user.username}</span>
              </Link>
            ) : (
              <>
                {canvas.user?.avatar ? (
                  <img
                    src={canvas.user.avatar}
                    alt={canvas.user?.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <BsPersonCircle size={16} />
                )}
                <span>{canvas.user?.name ?? 'Unknown'}</span>
              </>
            )}
            <span>·</span>
            <span>
              {new Date(canvas.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {canvas.description && (
            <p className="text-white/50 text-sm leading-relaxed">{canvas.description}</p>
          )}
        </div>

        {/* Canvas thumbnail */}
        <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0f1117] mb-6 shadow-xl shadow-black/30">
          {canvas.thumbnail ? (
            <img
              src={canvas.thumbnail}
              alt={canvas.title}
              className="w-full h-auto object-contain"
            />
          ) : canvas.data ? (
            <CanvasDataPreview data={canvas.data} title={canvas.title} className="aspect-video min-h-[260px] bg-[#1e2128]" />
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center gap-3 text-white/15">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                <rect width="24" height="24" rx="6" fill="currentColor" fillOpacity=".05" />
                <path d="M7 17l3.5-4.5 2.5 3 1.5-2 2.5 3.5H7z" fill="currentColor" />
              </svg>
              <span className="text-xs">No preview available</span>
            </div>
          )}
        </div>

        {/* Like + comment counts */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.06]">
          <button
            onClick={handleLike}
            disabled={toggleLike.isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${
              liked
                ? 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/15'
                : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08] hover:text-white/70'
            }`}
          >
            {liked ? <BsHeartFill size={14} /> : <BsHeart size={14} />}
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </button>
          <button
            onClick={() => {
              setLikesPage(1);
              setLikesOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm font-medium text-white/45 hover:bg-white/[0.08] hover:text-white/70 transition-all"
          >
            <BsPeople size={14} />
            View likers
          </button>

          <span className="flex items-center gap-2 text-sm text-white/35">
            <BsChatLeft size={13} />
            {commentsData?.total ?? 0} thread{commentsData?.total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Comments section */}
        <div>
          <h2 className="font-bold text-base mb-4">Comments</h2>

          {replyingTo && (
            <form onSubmit={handleAddReply} className="mb-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/8 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs text-indigo-200/80">
                  Replying to {replyingTo.user?.name ?? replyingTo.user?.username ?? 'comment'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="text-xs text-white/35 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full bg-black/20 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-indigo-400/50 transition-colors"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!replyText.trim() || addComment.isLoading}
                  className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Reply
                </button>
              </div>
            </form>
          )}

          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="mb-6 flex gap-3 items-start">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 mt-2"
              />
            ) : (
              <BsPersonCircle
                size={28}
                className={`shrink-0 mt-2 ${user ? 'text-white/40' : 'text-white/15'}`}
              />
            )}
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onFocus={() => !user && requireAuth()}
                placeholder={user ? 'Write a comment…' : 'Sign in to comment'}
                rows={2}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim() || addComment.isLoading}
                  className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Post
                </button>
              </div>
            </div>
          </form>

          {/* Comment list */}
          {!commentsData?.items?.length ? (
            <p className="text-center py-8 text-white/20 text-sm">
              No comments yet. Be the first!
            </p>
          ) : (
            <div className="divide-y-0">
              {commentsData.items.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  canvasId={id}
                  canvasOwnerId={canvas.userId}
                  onDelete={(commentId) => deleteComment.mutate({ commentId })}
                  onReply={setReplyingTo}
                />
              ))}
              {commentsData.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 text-xs text-white/30">
                  <button
                    disabled={commentPage === 1}
                    onClick={() => setCommentPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span>Page {commentPage} of {commentsData.pages}</span>
                  <button
                    disabled={commentPage === commentsData.pages}
                    onClick={() => setCommentPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter maxWidth="max-w-4xl" />

      <AuthModal opened={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <LikesModal
        opened={likesOpen}
        canvasId={id}
        page={likesPage}
        setPage={setLikesPage}
        onClose={() => setLikesOpen(false)}
      />
      {historyOpen && isOwner && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setHistoryOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <HistoryPanel
              canvasId={canvas.id}
              ownerUsername={canvas.user?.username ?? undefined}
              onClose={() => setHistoryOpen(false)}
              onRestore={(data) => {
                stageEditorCanvasLoad({
                  data,
                  id: canvas.id,
                  title: canvas.title ?? '',
                  description: canvas.description ?? '',
                  isPublic: !!canvas.isPublic,
                });
                setHistoryOpen(false);
                navigate('/editor');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
