import { useState, useEffect } from 'react';
import { BsSearch, BsPersonCircle, BsXLg, BsPeopleFill } from 'react-icons/bs';
import { trpc } from '../lib/trpc';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';

export function SharePrivateModal({ opened, onClose, canvasId, currentShares }) {
  const utils = trpc.useUtils();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [shares, setShares] = useState(() => currentShares ?? []);
  const debouncedQuery = useDebounce(query, 350);

  const searchResults = trpc.user.search.useQuery(
    { q: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const shareWith = trpc.canvas.shareWith.useMutation({
    onSuccess: () => {
      utils.canvas.myList.invalidate();
      utils.canvas.sharedWithMe.invalidate();
      utils.canvas.byId.invalidate({ id: canvasId });
      toast.success('Canvas shared!');
    },
    onError: () => toast.error('Failed to share canvas.'),
  });

  const revokeShare = trpc.canvas.revokeShare.useMutation({
    onSuccess: () => {
      utils.canvas.myList.invalidate();
      utils.canvas.sharedWithMe.invalidate();
      utils.canvas.byId.invalidate({ id: canvasId });
      toast.info('Access revoked.');
    },
  });

  useEffect(() => {
    if (!opened) setQuery('');
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    setShares(currentShares ?? []);
  }, [currentShares, opened]);

  useEffect(() => {
    if (!opened) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [opened]);

  if (!opened) return null;

  // build a set of already-shared user ids from currentShares
  const sharedIds = new Set(shares.map((s) => s.user?.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#14161d] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BsPeopleFill className="text-indigo-400" size={18} />
            <h2 className="font-bold text-base">Share with people</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <BsXLg size={15} />
          </button>
        </div>

        {/* Currently shared */}
        {shares.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2">
              Currently shared with
            </p>
            <div className="flex flex-col gap-1.5">
              {shares.map((share) => (
                <div
                  key={share.user?.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]"
                >
                  {share.user?.avatar ? (
                    <img src={share.user.avatar} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <BsPersonCircle size={28} className="text-white/30 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{share.user?.name ?? 'Unknown'}</p>
                    {share.user?.username && (
                      <p className="text-xs text-white/35">@{share.user.username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => revokeShare.mutate(
                      { canvasId, userId: share.user.id },
                      {
                        onSuccess: () => {
                          setShares((prev) => prev.filter((entry) => entry.user?.id !== share.user.id));
                        },
                      }
                    )}
                    disabled={revokeShare.isLoading}
                    className="text-xs text-red-400/70 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <BsSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username…"
            className="w-full pl-9 pr-3 py-2.5 bg-[#1e2028] border border-white/[0.08] rounded-xl text-sm outline-none focus:border-indigo-500/50 placeholder-white/25 transition-colors"
          />
        </div>

        {/* Results */}
        {debouncedQuery.length >= 2 && (
          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
            {searchResults.isLoading && (
              <p className="text-white/30 text-xs text-center py-4">Searching…</p>
            )}
            {!searchResults.isLoading && searchResults.data?.length === 0 && (
              <p className="text-white/30 text-xs text-center py-4">No users found</p>
            )}
            {searchResults.data?.map((u) => {
              const alreadyShared = sharedIds.has(u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-all"
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <BsPersonCircle size={28} className="text-white/30 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name ?? 'Unnamed'}</p>
                    {u.username && (
                      <p className="text-xs text-white/35">@{u.username}</p>
                    )}
                  </div>
                  <button
                    disabled={alreadyShared || shareWith.isLoading}
                    onClick={() => shareWith.mutate(
                      { canvasId, userId: u.id },
                      {
                        onSuccess: () => {
                          setShares((prev) => [...prev, { user: u }]);
                        },
                      }
                    )}
                    className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                      alreadyShared
                        ? 'text-white/25 bg-white/5 cursor-default'
                        : 'text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25'
                    }`}
                  >
                    {alreadyShared ? 'Shared' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-[11px] text-white/25 leading-relaxed">
          People you share with can view this private canvas and open it in their editor. Only the owner can overwrite the original.
        </p>
      </div>
    </div>
  );
}
