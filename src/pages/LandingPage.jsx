import { useNavigate } from 'react-router-dom';
import {
  BsPencilFill,
  BsFillImageFill,
  BsArrowRight,
  BsGithub,
  BsVectorPen,
  BsBoundingBox,
} from 'react-icons/bs';
import { BiRectangle } from 'react-icons/bi';
import { MdOutlineColorLens } from 'react-icons/md';
import { GoDesktopDownload } from 'react-icons/go';
import { TbLayersIntersect, TbVectorBezier2, TbShape, TbDatabase } from 'react-icons/tb';

const FEATURES = [
  {
    icon: <TbShape size={20} />,
    tag: 'Shapes',
    title: 'Every shape you could need',
    desc: 'Rectangles, circles, stars, diamonds, hexagons, cylinders — pick one and drop it on the canvas.',
    color: 'indigo',
  },
  {
    icon: <TbVectorBezier2 size={20} />,
    tag: 'Connectors',
    title: 'Connect shapes with a click',
    desc: 'Click one shape, move your cursor to another, click again. Lines snap to anchor points automatically.',
    color: 'violet',
  },
  {
    icon: <GoDesktopDownload size={20} />,
    tag: 'Export',
    title: 'Save and share your work',
    desc: 'Download a sharp image or save the whole canvas to a file. Reopen it later exactly as you left it.',
    color: 'fuchsia',
  },
  {
    icon: <BsBoundingBox size={18} />,
    tag: 'Auto-save',
    title: 'Your work is never lost',
    desc: 'Pixora quietly saves your canvas as you go. Close the tab, come back later — it is right where you left it.',
    color: 'emerald',
  },
  {
    icon: <TbLayersIntersect size={20} />,
    tag: 'Layers',
    title: 'Keep things organized',
    desc: 'Move shapes forward or back, group them together and move as one. Full control without the clutter.',
    color: 'sky',
  },
  {
    icon: <BsFillImageFill size={17} />,
    tag: 'Images',
    title: 'Drop in photos too',
    desc: 'Upload any picture to the canvas. Use the built-in background remover to cut out exactly what you need.',
    color: 'amber',
  },
];

const COLOR_MAP = {
  indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'hover:border-indigo-500/35',  shadow: 'hover:shadow-indigo-500/10'  },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'hover:border-violet-500/35',  shadow: 'hover:shadow-violet-500/10'  },
  fuchsia: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'hover:border-fuchsia-500/35', shadow: 'hover:shadow-fuchsia-500/10' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'hover:border-emerald-500/35', shadow: 'hover:shadow-emerald-500/10' },
  sky:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'hover:border-sky-500/35',     shadow: 'hover:shadow-sky-500/10'     },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'hover:border-amber-500/35',   shadow: 'hover:shadow-amber-500/10'   },
};

const STEPS = [
  { n: '01', title: 'Open the canvas',   desc: 'No login, no app to install. Just click "Start drawing" and it opens right in your browser tab.' },
  { n: '02', title: 'Build your diagram', desc: 'Add shapes, write labels, draw arrows. Move things around until it looks right.' },
  { n: '03', title: 'Save or share',     desc: 'Download an image to share, or save the canvas file to pick up exactly where you left off.' },
];

const SHORTCUTS = [
  { keys: ['Ctrl', 'Z'],      desc: 'Undo'         },
  { keys: ['Ctrl', 'Y'],      desc: 'Redo'         },
  { keys: ['Ctrl', 'D'],      desc: 'Duplicate'    },
  { keys: ['Ctrl', 'A'],      desc: 'Select all'   },
  { keys: ['Ctrl', 'G'],      desc: 'Group'        },
  { keys: ['Ctrl', 'C/V'],    desc: 'Copy / paste' },
  { keys: ['B'],              desc: 'Brush'        },
  { keys: ['L'],              desc: 'Line tool'    },
  { keys: ['Del'],            desc: 'Delete'       },
  { keys: ['Esc'],            desc: 'Exit mode'    },
  { keys: ['↑↓←→'],          desc: 'Nudge 1px'   },
  { keys: ['Shift', '↑↓←→'], desc: 'Nudge 10px'  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-sans overflow-x-hidden">

      {/* ── Animated ambient background ─────────────────────── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full bg-indigo-600/8 animate-blob blur-3xl" />
        <div className="absolute top-1/2 -right-64 w-[550px] h-[550px] rounded-full bg-violet-600/6 animate-blob blur-3xl" style={{ animationDelay: '-4s' }} />
        <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full bg-fuchsia-600/5 animate-blob blur-3xl" style={{ animationDelay: '-8s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.035)_1px,transparent_0)] [background-size:30px_30px]" />
      </div>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#07090e]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <BsPencilFill size={13} />
            </div>
            <span className="font-bold tracking-tight truncate">Pixora</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a href="https://github.com/ELHart05/pixora" target="_blank" rel="noopener noreferrer"
              className="text-white/35 hover:text-white transition-colors p-1" aria-label="GitHub">
              <BsGithub size={17} />
            </a>
            <button
              onClick={() => navigate('/editor')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-900/40 whitespace-nowrap"
            >
              Open editor <BsArrowRight size={12} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(99,102,241,0.18),transparent)] pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Free to use · No sign-up needed
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left: copy */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-5">
                Sketch ideas.<br />
                <span className="gradient-text">Make them clear.</span>
              </h1>
              <p className="text-white/50 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
                A free canvas tool that runs in your browser. Add shapes, connect them
                with arrows, annotate — then save or share when you're done.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-9">
                <button
                  onClick={() => navigate('/editor')}
                  className="group flex items-center gap-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl transition-all shadow-xl shadow-indigo-900/40 hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  Start drawing
                  <BsArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#features"
                  className="flex items-center gap-2 text-white/55 hover:text-white border border-white/10 hover:border-white/20 font-medium px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl transition-all text-sm sm:text-base"
                >
                  See what it does
                </a>
              </div>

              {/* Simple trust signals */}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {['Works right in your browser', 'Nothing to install', 'Your work auto-saves'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-xs text-white/35">
                    <span className="w-1 h-1 rounded-full bg-indigo-400/60 shrink-0" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: canvas mockup — contained, no overflowing decorations */}
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-fuchsia-600/8 rounded-3xl blur-2xl animate-glow" />
              <div className="relative rounded-2xl border border-white/[0.09] overflow-hidden shadow-2xl shadow-black/70 bg-[#0f1117]">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-3 sm:px-4 py-3 border-b border-white/[0.06] bg-[#13151a]">
                  <div className="w-3 h-3 rounded-full bg-red-500/50 shrink-0" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50 shrink-0" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50 shrink-0" />
                  <div className="flex-1 mx-2 sm:mx-3 h-5 rounded bg-white/5 flex items-center px-2 min-w-0 overflow-hidden">
                    <span className="text-[10px] text-white/20 font-mono truncate">pixora — canvas.json</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-medium border border-indigo-500/20 shrink-0 whitespace-nowrap">● Live</span>
                </div>

                {/* Canvas */}
                <div className="relative overflow-hidden" style={{ height: 260, background: '#1a1d24' }}>
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:24px_24px]" />
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <line x1="86" y1="90" x2="200" y2="145" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.45" strokeDasharray="5 3" />
                    <line x1="200" y1="145" x2="310" y2="90" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="5 3" />
                    <line x1="200" y1="157" x2="200" y2="215" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="5 3" />
                    <rect x="50" y="66" width="72" height="46" rx="6" fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.7" />
                    <circle cx="200" cy="147" r="26" fill="rgba(167,139,250,0.1)" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity="0.7" />
                    <polygon points="310,68 342,90 310,112 278,90" fill="rgba(196,132,252,0.1)" stroke="#c084fc" strokeWidth="1.5" strokeOpacity="0.65" />
                    <rect x="163" y="203" width="74" height="36" rx="4" fill="rgba(99,102,241,0.08)" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.5" />
                    <path d="M52 246 Q72 232 88 242 T118 235 T148 243" fill="none" stroke="#f472b6" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
                    <circle cx="200" cy="147" r="7" fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.8" />
                  </svg>
                  <div className="absolute top-[76px] left-[58px] text-[8px] text-indigo-300/60 font-mono">start</div>
                  <div className="absolute top-[140px] left-[188px] text-[8px] text-violet-300/60 font-mono">if</div>
                  <div className="absolute top-[78px] left-[299px] text-[8px] text-purple-300/60 font-mono">decide</div>
                  <div className="absolute top-[211px] left-[172px] text-[8px] text-indigo-300/50 font-mono">output</div>
                </div>

                {/* Toolbar strip */}
                <div className="flex items-center px-3 sm:px-4 py-2.5 border-t border-white/[0.06] bg-[#13151a] gap-2 overflow-hidden">
                  {[{ l: 'Rect' }, { l: 'Circle' }, { l: 'Line' }, { l: 'Text' }, { l: 'Draw', a: true }].map(({ l, a }) => (
                    <span key={l} className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                      a ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-white/25'
                    }`}>{l}</span>
                  ))}
                  <span className="ml-auto text-[10px] text-white/20 font-mono hidden sm:block shrink-0 whitespace-nowrap">✓ saved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3">What you can do</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight max-w-sm">Built for explaining things visually.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon, tag, title, desc, color }) => {
              const c = COLOR_MAP[color];
              return (
                <div
                  key={title}
                  className={`p-5 rounded-2xl bg-white/[0.025] border border-white/[0.07] hover:shadow-lg transition-all duration-300 cursor-default ${c.border} ${c.shadow}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.text} flex items-center justify-center mb-4`}>
                    {icon}
                  </div>
                  <p className={`text-[10px] font-mono uppercase tracking-widest ${c.text} mb-1`}>{tag}</p>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">From blank page to finished diagram.</h2>
            <p className="text-white/35 text-sm mt-2">Three steps, no learning curve required.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="font-black text-sm gradient-text-indigo">{n}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="hidden sm:block flex-1 h-px bg-white/[0.05]" />}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Keyboard shortcuts ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-mono text-sky-400 uppercase tracking-widest mb-3">Shortcuts</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Work without lifting your hands.</h2>
            <p className="text-white/35 text-sm mt-2">Every common action has a key — less clicking, more creating.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {SHORTCUTS.map(({ keys, desc }) => (
              <div key={desc} className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-white/10 transition-colors min-w-0">
                <div className="flex items-center gap-1 shrink-0">
                  {keys.map((k) => (
                    <kbd key={k} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/8 border border-white/10 text-white/55">
                      {k}
                    </kbd>
                  ))}
                </div>
                <span className="text-xs text-white/40 min-w-0 truncate">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 via-violet-600/15 to-fuchsia-600/10 border border-white/[0.08] p-8 sm:p-12 lg:p-16 text-center">
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
                Give it a try —<br className="hidden sm:block" />
                <span className="gradient-text"> it takes 10 seconds.</span>
              </h2>
              <p className="text-white/45 text-base sm:text-lg mb-8 max-w-xs sm:max-w-sm mx-auto">
                No sign-up. Just open the canvas and start drawing.
              </p>
              <button
                onClick={() => navigate('/editor')}
                className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl transition-all shadow-2xl shadow-indigo-900/50 hover:-translate-y-0.5 text-sm sm:text-base"
              >
                Open the canvas
                <BsArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-0 sm:justify-between text-xs text-white/30">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
              <BsPencilFill size={9} />
            </div>
            <span className="font-semibold text-white/40">Pixora</span>
            <span className="text-white/15">·</span>
            <span className="whitespace-nowrap">Free, open-source canvas tool</span>
          </div>
          <a href="https://github.com/ELHart05/pixora" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white/60 transition-colors shrink-0 whitespace-nowrap">
            <BsGithub size={13} /> View on GitHub
          </a>
        </div>
      </footer>

    </div>
  );
}

