/**
 * Zentralisierte Design Tokens für konsistente Styling-Standards
 * Verwendet in allen Komponenten für einheitliches Design
 */

// ─── BORDER COLORS ───────────────────────────────────────────────────────────
export const BORDER_COLORS = {
  primary: '#ccc',
  secondary: '#D1D9D8',
  light: '#e2e8f0', // slate-200
  lighter: '#f1f5f9', // slate-100
  muted: '#cbd5e1', // slate-300
  error: '#ef4444', // red-500
  errorLight: '#fca5a5', // red-400
  errorBg: '#fee2e2', // red-50
} as const;

// ─── BACKGROUND COLORS ──────────────────────────────────────────────────────
export const BG_COLORS = {
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  errorBg: '#fee2e2',
  errorLight: '#fef2f2',
  successBg: '#f0fdf4',
  warningBg: '#fffbeb',
  infoBg: '#f0f9ff',
} as const;

// ─── TEXT COLORS ────────────────────────────────────────────────────────────
export const TEXT_COLORS = {
  primary: '#1e293b', // slate-900
  secondary: '#475569', // slate-600
  muted: '#64748b', // slate-500
  light: '#94a3b8', // slate-400
  lighter: '#cbd5e1', // slate-300
  error: '#dc2626', // red-600
  errorLight: '#ef4444', // red-500
} as const;

// ─── SHADOWS ─────────────────────────────────────────────────────────────────
export const SHADOWS = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  overlay: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const;

// ─── BORDER RADIUS ──────────────────────────────────────────────────────────
export const BORDER_RADIUS = {
  none: '0',
  xs: '2px',
  sm: '4px', // rounded-sm in Tailwind
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
  // Custom sizes für spezielle Fälle
  default: '3px', // Verwendet in Onboarding/Settings
} as const;

// ─── INPUT HEIGHTS ──────────────────────────────────────────────────────────
export const INPUT_HEIGHTS = {
  dense: '2.25rem', // h-9 = 36px
  standard: '2.75rem', // h-11 = 44px
  large: '3.25rem', // h-13 = 52px
  compact: '1.875rem', // h-7.5 = 30px
} as const;

// ─── SPACING ────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem', // 48px
  '4xl': '4rem', // 64px
} as const;

// ─── TRANSITIONS ────────────────────────────────────────────────────────────
export const TRANSITIONS = {
  fast: 'all 0.15s ease-in-out',
  standard: 'all 0.3s ease-in-out',
  slow: 'all 0.5s ease-in-out',
  colors: 'colors 0.2s ease-in-out',
} as const;

// ─── FONT SIZES ─────────────────────────────────────────────────────────────
export const FONT_SIZES = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
} as const;

// ─── LABEL CLASSES ──────────────────────────────────────────────────────────
export const LABEL_CLASSES = {
  default: 'text-xs font-semibold text-slate-600 mb-1',
  small: 'text-[11px] font-semibold text-slate-600 mb-0.5',
  large: 'text-sm font-medium text-slate-700',
  disabled: 'text-xs font-semibold text-slate-400 opacity-60',
} as const;

// ─── INPUT CLASSES ──────────────────────────────────────────────────────────
export const INPUT_CLASSES = {
  // Standard Input (Onboarding/Settings Style)
  standard:
    'h-9 w-full px-3 text-sm border border-[#ccc] rounded-[3px] outline-none transition-colors ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'placeholder:text-slate-300 ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  // Dense Input (Compact)
  dense:
    'h-7.5 w-full px-3 text-sm border border-[#ccc] rounded-[3px] outline-none transition-colors ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'placeholder:text-slate-300 ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  // Large Input
  large:
    'h-11 w-full px-3 text-sm border border-[#ccc] rounded-[3px] outline-none transition-colors ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'placeholder:text-slate-300 ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  // Error State
  error:
    'h-9 w-full px-3 text-sm border border-red-400 rounded-[3px] outline-none transition-colors ' +
    'bg-red-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'placeholder:text-red-300 ' +
    'focus:border-red-500 focus:ring-1 focus:ring-red-400/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  // Transparent (für ProjectPositionsTable Style)
  transparent:
    'w-full bg-transparent outline-none transition-colors duration-200 border-none ' +
    'focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',

  // ReadOnly
  readonly:
    'h-9 w-full px-3 text-sm border border-[#ccc] rounded-[3px] outline-none ' +
    'bg-slate-50 text-slate-500 cursor-not-allowed ' +
    'disabled:opacity-50',
} as const;

// ─── SELECT CLASSES ─────────────────────────────────────────────────────────
export const SELECT_CLASSES = {
  standard:
    'h-9 w-full appearance-none rounded-[3px] px-3 text-sm border border-[#ccc] outline-none transition-colors cursor-pointer ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  dense:
    'h-7.5 w-full appearance-none rounded-[3px] px-3 text-sm border border-[#ccc] outline-none transition-colors cursor-pointer ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  large:
    'h-11 w-full appearance-none rounded-[3px] px-3 text-sm border border-[#ccc] outline-none transition-colors cursor-pointer ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  error:
    'h-9 w-full appearance-none rounded-[3px] px-3 text-sm border border-red-400 outline-none transition-colors cursor-pointer ' +
    'bg-red-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'focus:border-red-500 focus:ring-1 focus:ring-red-400/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',
} as const;

// ─── TEXTAREA CLASSES ───────────────────────────────────────────────────────
export const TEXTAREA_CLASSES = {
  standard:
    'min-h-[80px] w-full px-3 py-2 text-sm border border-[#ccc] rounded-[3px] outline-none transition-colors resize-none ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'placeholder:text-slate-300 ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  dense:
    'min-h-[60px] w-full px-3 py-2 text-sm border border-[#ccc] rounded-[3px] outline-none transition-colors resize-none ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'placeholder:text-slate-300 ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  large:
    'min-h-[100px] w-full px-3 py-2 text-sm border border-[#ccc] rounded-[3px] outline-none transition-colors resize-none ' +
    'bg-gradient-to-b from-white to-[#fbfbfb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'placeholder:text-slate-300 ' +
    'focus:border-[#1B4D4F] focus:ring-1 focus:ring-[#1B4D4F]/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',

  error:
    'min-h-[80px] w-full px-3 py-2 text-sm border border-red-400 rounded-[3px] outline-none transition-colors resize-none ' +
    'bg-red-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ' +
    'placeholder:text-red-300 ' +
    'focus:border-red-500 focus:ring-1 focus:ring-red-400/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50',
} as const;

// ─── CONTAINER CLASSES ──────────────────────────────────────────────────────
export const CONTAINER_CLASSES = {
  card: 'bg-white border border-slate-200 rounded-sm shadow-sm',
  cardHover: 'bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow',
  panel: 'bg-white rounded-sm border border-slate-100',
  overlay: 'fixed inset-0 bg-black/50 z-40',
} as const;

// ─── MODAL SIZES ────────────────────────────────────────────────────────────
export const MODAL_SIZES = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  fullWidth: 'max-w-[90vw]',
  project: 'max-w-[1400px]', // For NewProjectModal
  custom: 'max-w-[900px]', // For EmailComposeModal
} as const;

// ─── MODAL CLASSES ──────────────────────────────────────────────────────────
export const MODAL_CLASSES = {
  base: 'rounded-sm border border-slate-200 bg-white shadow-2xl',
  header: 'flex items-center justify-between px-6 py-4 border-b border-slate-100',
  body: 'flex-1 overflow-y-auto px-6 py-4',
  footer: 'flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100',
  title: 'text-lg font-semibold text-slate-900',
  closeButton: 'text-slate-400 hover:text-slate-600 transition-colors',
} as const;

// ─── DIVIDER CLASSES ────────────────────────────────────────────────────────
export const DIVIDER_CLASSES = {
  default: 'border-b border-slate-100',
  light: 'border-b border-slate-50',
  dark: 'border-b border-slate-200',
  secondary: 'border-b border-[#D1D9D8]',
  top: 'border-t border-slate-100',
  both: 'border-t border-b border-slate-100',
} as const;

// ─── ROW CLASSES (Settings/Form Rows) ────────────────────────────────────────
export const ROW_CLASSES = {
  setting: 'grid grid-cols-12 gap-6 py-6 border-b border-slate-100 last:border-0 items-start',
  form: 'grid grid-cols-12 gap-4 py-4 items-start',
  compact: 'grid grid-cols-12 gap-3 py-3 items-start',
  labelCol: 'col-span-12 md:col-span-4',
  contentCol: 'col-span-12 md:col-span-8',
} as const;

// ─── FOCUS RING CLASSES ─────────────────────────────────────────────────────
export const FOCUS_RINGS = {
  primary: 'focus:outline-none focus:ring-2 focus:ring-[#1B4D4F]/20 focus:border-[#1B4D4F]',
  soft: 'focus:outline-none focus:ring-1 focus:ring-[#1B4D4F]/20',
  error: 'focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500',
} as const;

// ─── BUTTON CLASSES ─────────────────────────────────────────────────────────
export const BUTTON_CLASSES = {
  base: 'inline-flex items-center justify-center rounded-sm font-medium transition-colors',
  sizes: {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  },
  variants: {
    primary: 'bg-[#1B4D4F] text-white hover:bg-[#0f2d2f]',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
    outline: 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  },
} as const;

// ─── Z-INDEX SCALE ──────────────────────────────────────────────────────────
export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
} as const;
