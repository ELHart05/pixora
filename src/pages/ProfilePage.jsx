import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  BsPersonCircle, BsGlobe2, BsHeartFill, BsChatFill, BsGridFill,
  BsCalendar3, BsPencilFill, BsLockFill, BsPeopleFill,
} from 'react-icons/bs';
import { trpc } from '../lib/trpc';
import { useAuth } from '../context/AuthContext';
import { SiteFooter, SiteNavbar } from '../components/SiteChrome';
import { CanvasDataPreview } from '../components/CanvasDataPreview';
import { AuthModal } from '../components/AuthModal';
import { useToast } from '../context/ToastContext';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

function ConnectionsModal({ opened, type, username, onClose }) {
  const [page, setPage] = useState(1);
  const query = type === 'followers'
    ? trpc.user.followers.useQuery({ username, page, limit: 12 }, { enabled: opened && !!username })
    : trpc.user.following.useQuery({ username, page, limit: 12 }, { enabled: opened && !!username });

  if (!opened) return null;

  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#12141a] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="font-bold text-sm">{title}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white">x</button>
        </div>
        <div className="p-4 min-h-[220px]">
          {query.isLoading ? (
            <p className="text-sm text-white/30 py-8 text-center">Loading...</p>
          ) : !query.data?.items?.length ? (
            <p className="text-sm text-white/30 py-8 text-center">Nothing to show yet.</p>
          ) : (
            <div className="space-y-2">
              {query.data.items.map((person) => (
                <Link
                  key={person.id}
                  to={person.username ? `/u/${person.username}` : '#'}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.05] transition-colors"
                  onClick={onClose}
                >
                  {person.avatar ? (
                    <img src={person.avatar} alt={person.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  ) : (
                    <BsPersonCircle size={30} className="text-white/25" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/75 truncate">{person.name ?? person.username ?? 'User'}</p>
                    {person.username && <p className="text-xs text-white/30 truncate">@{person.username}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        {(query.data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-white/[0.07] text-xs text-white/30">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">Previous</button>
            <span>Page {page} of {query.data.pages}</span>
            <button disabled={page === query.data.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const toast = useToast();
  const [canvasFilter, setCanvasFilter] = useState('all');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(null);

  const profile = trpc.user.byUsername.useQuery(
    { username: username ?? '' },
    { enabled: !!username }
  );

  const p = profile.data;
  const isOwnProfile = user?.id === p?.id;
  const canvases = p?.canvases ?? [];
  const filteredCanvases = useMemo(() => {
    if (!isOwnProfile) return canvases;
    if (canvasFilter === 'published') return canvases.filter((canvas) => canvas.isPublic);
    if (canvasFilter === 'private') return canvases.filter((canvas) => !canvas.isPublic);
    return canvases;
  }, [canvasFilter, isOwnProfile, canvases]);
  const publishedCount = canvases.filter((canvas) => canvas.isPublic).length;
  const privateCount = canvases.filter((canvas) => !canvas.isPublic).length;
  const followMutation = trpc.user.follow.useMutation({
    onSuccess: () => {
      utils.user.byUsername.invalidate({ username: username ?? '' });
      if (user?.username) {
        utils.user.byUsername.invalidate({ username: user.username });
      }
      utils.user.followers.invalidate({ username: username ?? '' });
      utils.user.following.invalidate({ username: username ?? '' });
      utils.canvas.feed.invalidate();
      toast.success('Now following.');
    },
    onError: (error) => toast.error(error.message ?? 'Failed to follow user.'),
  });
  const unfollowMutation = trpc.user.unfollow.useMutation({
    onSuccess: () => {
      utils.user.byUsername.invalidate({ username: username ?? '' });
      if (user?.username) {
        utils.user.byUsername.invalidate({ username: user.username });
      }
      utils.user.followers.invalidate({ username: username ?? '' });
      utils.user.following.invalidate({ username: username ?? '' });
      utils.canvas.feed.invalidate();
      toast.info('Unfollowed.');
    },
    onError: () => toast.error('Failed to unfollow user.'),
  });

  if (profile.isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0f14] flex items-center justify-center text-white/30 text-sm">
        Loading…
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="min-h-screen bg-[#0e0f14] flex flex-col items-center justify-center gap-3">
        <p className="text-white/40 text-lg font-semibold">User not found</p>
        <p className="text-white/25 text-sm">@{username} doesn't exist.</p>
        <Link to="/" className="text-indigo-400 hover:underline text-sm">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col">
      <SiteNavbar maxWidth="max-w-4xl" />

      <div className="flex-1 max-w-4xl mx-auto px-4 pt-24 pb-12 w-full">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-12">
          {p.avatar ? (
            <img
              src={p.avatar}
              alt={p.name}
              className="w-24 h-24 rounded-full object-cover ring-2 ring-white/10 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <BsPersonCircle size={52} className="text-indigo-300" />
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{p.name ?? 'Unnamed user'}</h1>
            {p.username && (
              <p className="text-white/40 text-sm mt-0.5">@{p.username}</p>
            )}
            {p.bio && (
              <p className="text-white/60 text-sm mt-3 max-w-md leading-relaxed">{p.bio}</p>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-white/30">
              <span className="flex items-center gap-1.5">
                <BsCalendar3 size={11} /> Joined {timeAgo(p.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <BsGridFill size={11} /> {isOwnProfile ? (p.canvases?.length ?? 0) : publishedCount} {isOwnProfile ? 'canvas' : 'public canvas'}{((isOwnProfile ? (p.canvases?.length ?? 0) : publishedCount) !== 1) ? 'es' : ''}
              </span>
              <button
                type="button"
                onClick={() => setConnectionsOpen('followers')}
                className="flex items-center gap-1.5 hover:text-white/60 transition-colors"
              >
                <BsPeopleFill size={11} /> {p._count?.followers ?? 0} follower{(p._count?.followers ?? 0) !== 1 ? 's' : ''}
              </button>
              <button
                type="button"
                onClick={() => setConnectionsOpen('following')}
                className="flex items-center gap-1.5 hover:text-white/60 transition-colors"
              >
                <BsPeopleFill size={11} /> {p._count?.following ?? 0} following
              </button>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/settings/profile')}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] text-sm font-medium transition-all"
              >
                <BsPencilFill size={12} /> Edit profile
              </button>
            )}
            {!isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setAuthModalOpen(true);
                    return;
                  }
                  if (p.viewerFollows) {
                    unfollowMutation.mutate({ userId: p.id });
                  } else {
                    followMutation.mutate({ userId: p.id });
                  }
                }}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={`mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
                  p.viewerFollows
                    ? 'bg-white/5 hover:bg-white/10 border-white/[0.08] text-white/70'
                    : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/30 text-indigo-300'
                }`}
              >
                {p.viewerFollows ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'all', label: `All (${p.canvases?.length ?? 0})` },
              { key: 'published', label: `Published (${publishedCount})` },
              { key: 'private', label: `Private (${privateCount})` },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setCanvasFilter(option.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  canvasFilter === option.key
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-white/5 text-white/50 border-white/[0.08] hover:bg-white/10 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Canvases */}
        {filteredCanvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/25">
            <BsGridFill size={32} />
            <p className="text-sm">
              {isOwnProfile
                ? canvasFilter === 'private'
                  ? 'You have no private canvases yet.'
                  : canvasFilter === 'published'
                  ? 'You have no published canvases yet.'
                  : 'You have no canvases yet.'
                : 'No public canvases.'}
            </p>
            {isOwnProfile && (
              <Link to="/editor" className="text-indigo-400 hover:underline text-sm">
                Create your first canvas
              </Link>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/30 mb-4">
              {isOwnProfile
                ? canvasFilter === 'published'
                  ? 'Published canvases'
                  : canvasFilter === 'private'
                  ? 'Private canvases'
                  : 'All canvases'
                : 'Public canvases'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCanvases.map((canvas) => (
                <Link
                  key={canvas.id}
                  to={`/p/${canvas.id}`}
                  className="group bg-[#12141a] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/15 transition-all"
                >
                  <div className="aspect-video bg-[#1e2128]">
                    {canvas.thumbnail ? (
                      <img src={canvas.thumbnail} alt={canvas.title} className="w-full h-full object-cover" />
                    ) : canvas.data ? (
                      <CanvasDataPreview data={canvas.data} title={canvas.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/10 text-3xl">✦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-1">{canvas.title}</h3>
                    {canvas.description && (
                      <p className="text-white/35 text-xs mt-1 line-clamp-2">{canvas.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-white/30 text-xs">
                      <span className="flex items-center gap-1"><BsHeartFill size={10} />{canvas._count?.likes ?? 0}</span>
                      <span className="flex items-center gap-1"><BsChatFill size={10} />{canvas._count?.comments ?? 0}</span>
                      {canvas.isPublic ? (
                        <BsGlobe2 size={10} className="ml-auto text-indigo-400/50" />
                      ) : (
                        <BsLockFill size={10} className="ml-auto text-white/35" />
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <ConnectionsModal
        opened={!!connectionsOpen}
        type={connectionsOpen ?? 'followers'}
        username={username ?? ''}
        onClose={() => setConnectionsOpen(null)}
      />
      <AuthModal opened={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <SiteFooter maxWidth="max-w-4xl" />
    </div>
  );
}
