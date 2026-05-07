import { BsXLg, BsClockHistory, BsArrowCounterclockwise, BsCheckCircleFill } from 'react-icons/bs';
import { trpc } from '../lib/trpc';
import { useToast } from '../context/ToastContext';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function HistoryPanel({ canvasId, onRestore, onClose, ownerUsername }) {
  const toast = useToast();
  const utils = trpc.useUtils();
  const history = trpc.canvas.history.useQuery(
    { canvasId },
    { enabled: !!canvasId }
  );

  const restoreMutation = trpc.canvas.restoreRevision.useMutation({
    onSuccess: (result) => {
      utils.canvas.history.invalidate({ canvasId });
      utils.canvas.byId.invalidate({ id: canvasId });
      utils.canvas.myList.invalidate();
      utils.canvas.publicList.invalidate();
      utils.canvas.feed.invalidate();
      if (ownerUsername) {
        utils.user.byUsername.invalidate({ username: ownerUsername });
      }
      toast.success('Version restored!');
      onRestore(result.data);
    },
    onError: () => {
      toast.error('Failed to restore version.');
    },
  });

  const revisions = history.data ?? [];

  return (
    <div className="w-80 h-full flex flex-col bg-[#0e0f14] border-l border-white/[0.07]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <BsClockHistory size={14} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Version history</p>
            <p className="text-[11px] text-white/30">{revisions.length} version{revisions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 transition-all"
        >
          <BsXLg size={13} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {history.isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin" />
            <p className="text-white/25 text-xs">Loading history…</p>
          </div>
        )}

        {!history.isLoading && revisions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/20">
            <BsClockHistory size={28} />
            <p className="text-xs font-medium">No history yet</p>
            <p className="text-[11px] text-white/15 text-center px-6">
              Versions are created each time you save. Try saving first.
            </p>
          </div>
        )}

        {revisions.length > 0 && (
          <div className="py-2">
            {revisions.map((rev, idx) => (
              <div
                key={rev.id}
                className={`group relative px-5 py-3.5 transition-all cursor-default ${
                  idx === 0
                    ? 'bg-indigo-500/[0.06]'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Left timeline */}
                <div className="absolute left-[17px] top-0 bottom-0 flex flex-col items-center">
                  {idx > 0 && <div className="w-px flex-1 bg-white/[0.06]" />}
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 my-1 ${
                    idx === 0
                      ? 'border-indigo-400 bg-indigo-400/40 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                      : 'border-white/15 bg-[#0e0f14]'
                  }`} />
                  {idx < revisions.length - 1 && <div className="w-px flex-1 bg-white/[0.06]" />}
                </div>

                {/* Content */}
                <div className="flex items-center gap-3 ml-7">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold ${idx === 0 ? 'text-white' : 'text-white/70'}`}>
                        {rev.note ?? 'Auto-save'}
                      </p>
                      {idx === 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                          <BsCheckCircleFill size={8} />
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/25 mt-0.5">
                      {timeAgo(rev.createdAt)}
                    </p>
                  </div>

                  {idx !== 0 && (
                    <button
                      onClick={() => restoreMutation.mutate({ revisionId: rev.id })}
                      disabled={restoreMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-[11px] text-indigo-300 hover:text-indigo-200 font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 transition-all shrink-0"
                      title="Restore this version"
                    >
                      <BsArrowCounterclockwise size={12} />
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.07] shrink-0">
        <p className="text-[11px] text-white/20 leading-relaxed">
          Up to 50 versions are kept automatically. Restoring a version creates a snapshot of the current state first.
        </p>
      </div>
    </div>
  );
}
