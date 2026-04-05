// ============================================================
// TRANSLATION OFFICE — CENTRAL DESIGN TOKEN SYSTEM
// Single Source of Truth for all design tokens.
// Import from this file in antd-theme.ts and components.
// NEVER hardcode hex values elsewhere — reference CSS_VARS instead.
// ============================================================

// ── PRIMARY BRAND PALETTE (Teal) ──────────────────────────
export const BRAND = {
  primary: '#1B4D4F',   // Main Brand Teal (from Navbar)
  primaryHover: '#225A5C',   // Refined hover
  primaryHoverAlt: '#2A7073',   // Refined gradient top
  primaryActive: '#133D3F',   // Refined active
  primaryDark: '#123739',   // Refined shadow base
  primaryBorder: '#123A3C',   // Refined border
  primaryLight: '#F0F7F6',   // Faint background
  primaryMid: '#D0EAE8',   // selection
  primaryFaint: '#F8FBFB',   // Near-white teal
  // Table component tints (Teal-Abstufungen)
  tableHeader: '#e4efef',
  tableHeaderSort: '#d8e8e8',
  tableHeaderHover: '#dff0ef',
  tableHeaderSplit: '#b8cecd',
  tableRowSelHover: '#b8dbd8',
  tableRowExpanded: '#f4fafa',
  tableFooter: '#f4f9f9',
  modalHeader: '#f4f9f9',
} as const;

// ── ACCENT PALETTE (Green) ────────────────────────────────
export const ACCENT = {
  primary: '#9BCB56',         // Brand Accent Green (Action)
  hover: '#8AB847',
  light: '#F0F8E0',         // Soft lime tint
  mid: '#D4EDAA',
  secondary: '#10B981',     // Emerald subtle accent
  tertiary: '#F59E0B',      // Amber subtle accent
} as const;

// ── STATUS COLORS ─────────────────────────────────────────
export const STATUS = {
  // Danger gradient tints (Button)
  dangerBtnLight: '#e05050',   // Gradient-Top (Button)
  dangerMid: '#e85555',   // Hover-Gradient-Top
  dangerHoverMid: '#d4302c',   // Hover-Gradient-Bottom

  // Success / Abgeschlossen / Bezahlt
  success: '#2e7d32',
  successHover: '#1b5e20',
  successLight: '#e8f5e9',
  successBorder: '#a5d6a7',

  // Warning / Angebot / Ausstehend
  warning: '#e65100',
  warningHover: '#bf360c',
  warningLight: '#fff3e0',
  warningBorder: '#ffcc80',

  // Danger / Storniert / Überfällig
  danger: '#c62828',
  dangerHover: '#b71c1c',
  dangerLight: '#ffebee',
  dangerBorder: '#ef9a9a',

  // Info / In Bearbeitung
  info: '#1565c0',
  infoHover: '#0d47a1',
  infoLight: '#e3f2fd',
  infoBorder: '#90caf9',

  // Purple / Dolmetscher / Termin
  purple: '#6a1b9a',
  purpleHover: '#4a148c',
  purpleLight: '#f3e5f5',
  purpleBorder: '#ce93d8',

  // Neutral / Entwurf / Archiv
  neutral: '#546e7a',
  neutralHover: '#37474f',
  neutralLight: '#eceff1',
  neutralBorder: '#b0bec5',

  // Active / Aktiv
  active: '#1B4D4F',     // = BRAND.primary
  activeLight: '#eaf4f3',     // = BRAND.primaryLight

  // Express / Urgent
  express: '#b71c1c',
  expressLight: '#ffebee',
} as const;

// ── NEUTRAL / GRAY PALETTE ───────────────────────────────
export const NEUTRAL = {
  white: '#ffffff',
  gray50: '#f9f9f9',
  gray100: '#f5f5f5',
  gray150: '#f0f0f0',
  gray200: '#e8e8e8',
  gray300: '#d0d0d0',
  gray400: '#bbb',
  gray500: '#8a8a8a',
  gray600: '#626B6A',
  gray700: '#444',
  gray800: '#333',
  gray900: '#1A1C1C',
} as const;

// ── BACKGROUNDS ──────────────────────────────────────────
export const BG = {
  app: '#F4F7F6',
  card: '#ffffff',
  tableOdd: '#f9f9f9',
  tableEven: '#ffffff',
  tableHover: '#f0f0f0',
  header: 'linear-gradient(to bottom, #f5f5f5 0%, #e8e8e8 100%)',
  code: '#EDF2F1',
} as const;

// ── TEXT ─────────────────────────────────────────────────
export const TEXT = {
  main: '#1A1C1C',
  secondary: '#2d3535',
  muted: '#626B6A',
  placeholder: '#a0aeae',
  inverse: '#ffffff',
} as const;

// ── BORDERS ──────────────────────────────────────────────
export const BORDER = {
  subtle: '#D1D9D8',
  secondary: '#e0eaea',
  header: '#c8c8c8',
  cell: '#e8e8e8',
  cellRight: '#f2f2f2',
} as const;

// ── TYPOGRAPHY ───────────────────────────────────────────
export const TYPOGRAPHY = {
  fontSans: "'Inter', system-ui, -apple-system, sans-serif",
  fontDisplay: "'Montserrat', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
  fontSizeBase: 13,
  fontSizeXs: 10,
  fontSizeSm: 12,
  fontSizeMd: 14,
} as const;

// ── RADIUS ───────────────────────────────────────────────
export const RADIUS = {
  none: 0,
  xs: 2,
  sm: 3,
  md: 4,
  lg: 6,
  xl: 8,
  xxl: 12,
} as const;

// ── SHADOWS ──────────────────────────────────────────────
export const SHADOW = {
  sm: '0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
  md: '0 2px 6px rgba(0,0,0,0.12)',
  primary: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(0,0,0,0.14)',
  inset: 'inset 0 3px 5px rgba(0,0,0,0.15)',
  input: 'inset 0 1px 3px rgba(0,0,0,0.06)',
  focus: '0 0 0 2px rgba(27, 77, 79, 0.12)',
} as const;

// ── CSS VARIABLEN REFERENZ (für Verwendung in Komponenten) ─
// Verwende immer diese CSS-Variablen statt Hex-Codes direkt!
export const CSS_VARS = {
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
  bgApp: 'var(--bg-app)',
  bgCard: 'var(--bg-card)',
  textMain: 'var(--text-main)',
  textMuted: 'var(--text-muted)',
  borderSubtle: 'var(--border-subtle)',

  // Status-Farben als CSS-Vars
  success: 'var(--status-success)',
  successLight: 'var(--status-success-light)',
  warning: 'var(--status-warning)',
  warningLight: 'var(--status-warning-light)',
  danger: 'var(--status-danger)',
  dangerLight: 'var(--status-danger-light)',
  info: 'var(--status-info)',
  infoLight: 'var(--status-info-light)',
  purple: 'var(--status-purple)',
  purpleLight: 'var(--status-purple-light)',
  neutral: 'var(--status-neutral)',
  neutralLight: 'var(--status-neutral-light)',
} as const;

// ── HILFSFUNKTIONEN ──────────────────────────────────────
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
