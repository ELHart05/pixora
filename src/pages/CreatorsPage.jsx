import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BsCalendar3,
  BsGridFill,
  BsPeopleFill,
  BsPersonCircle,
  BsSearch,
  BsSortDown,
} from 'react-icons/bs';
import { trpc } from '../lib/trpc';
import { SiteFooter, SiteNavbar } from '../components/SiteChrome';
import { useDebounce } from '../hooks/useDebounce';

function monthLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  });
}

function CreatorCard({ creator }) {
  return (
    <Link
      to={creator.username ? `/u/${creator.username}` : '#'}
      className="group bg-[#0f1117] border border-white/[0.07] rounded-2xl p-5 hover:border-white/15 hover:shadow-xl hover:shadow-black/40 transition-all duration-200"
    >
      <div className="flex items-start flex-col gap-4">
        {creator.avatar ? (
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
            <BsPersonCircle size={28} className="text-white/20" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-white truncate">
            {creator.name ?? creator.username ?? 'Unnamed user'}
          </h3>
          {creator.username && (
            <p className="text-xs text-white/35 truncate mt-0.5">@{creator.username}</p>
          )}
          {creator.bio && (
            <p className="text-xs text-white/40 mt-3 line-clamp-3 leading-relaxed">
              {creator.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 text-xs text-white/30">
        <span className="flex items-center gap-1">
          <BsGridFill size={11} />
          {creator.canvasCount} {creator.canvasCount === 1 ? 'canvas' : 'canvases'}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <BsCalendar3 size={11} />
          {monthLabel(creator.createdAt)}
        </span>
      </div>
    </Link>
  );
}

export default function CreatorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('most-canvases');
  const [filter, setFilter] = useState('all');
  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort, filter]);

  const { data, isLoading, isError } = trpc.user.creatorsList.useQuery({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    sort,
    filter,
  });

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
            Creators
          </h1>
          <p className="text-white/45 text-sm sm:text-base">
            Browse the people behind the diagrams, drafts, and shared work on Pixora.
          </p>
        </div>

        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <label className="relative block">
            <BsSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creators by name, username, or bio"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 outline-none focus:border-indigo-400/50 transition-colors"
            />
          </label>
          <label className="relative block min-w-[190px]">
            <BsSortDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white outline-none focus:border-indigo-400/50 transition-colors"
            >
              <option value="most-canvases">Most canvases</option>
              <option value="newest">Newest members</option>
              <option value="oldest">Oldest members</option>
              <option value="name">Alphabetical</option>
            </select>
          </label>
          <label className="relative block min-w-[190px]">
            <BsPeopleFill size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white outline-none focus:border-indigo-400/50 transition-colors"
            >
              <option value="all">All users</option>
              <option value="with-canvases">With published canvases</option>
              <option value="without-canvases">Without published canvases</option>
            </select>
          </label>
        </div>

        {data && (
          <div className="mb-8 text-sm text-white/30">
            {data.total} {data.total === 1 ? 'user' : 'users'}
          </div>
        )}

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/[0.05]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                    <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-white/30">
            <p className="text-lg mb-2">Couldn't load creators.</p>
            <p className="text-sm">Make sure the server is running.</p>
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <BsPeopleFill size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">{debouncedSearch ? 'No matching users found.' : 'No users to show yet.'}</p>
            <p className="text-sm">Try another filter or search term.</p>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.items.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>

            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="text-sm text-white/30 px-2">
                  Page {page} of {data.pages}
                </span>
                <button
                  disabled={page === data.pages}
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
    </div>
  );
}
