#!/usr/bin/env python3
"""
Shadcn-style mass refactor script.
Replaces inconsistent tailwind classes across the entire frontend codebase
to achieve a unified shadcn/ui aesthetic.
"""

import os
import re
import glob

SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')

# Files to skip (they have their own dedicated refactoring)
SKIP_FILES = {'index.css'}

def get_all_tsx_ts_files():
    """Get all .tsx and .ts files in the src directory."""
    files = []
    for ext in ['tsx', 'ts', 'css']:
        files.extend(glob.glob(os.path.join(SRC_DIR, '**', f'*.{ext}'), recursive=True))
    return sorted(files)

# Simple string replacements: (old, new)
REPLACEMENTS = [
    # ===== BORDER RADIUS: Standardize to rounded-sm (2px) =====
    # rounded-md -> rounded-sm (keep consistent small radius)
    ('rounded-md', 'rounded-sm'),
    # rounded-lg -> rounded-sm
    ('rounded-lg', 'rounded-sm'),
    # rounded-xl -> rounded-sm
    ('rounded-xl', 'rounded-sm'),
    # rounded-2xl -> rounded-sm
    ('rounded-2xl', 'rounded-sm'),
    # rounded-3xl -> rounded-sm
    ('rounded-3xl', 'rounded-sm'),

    # ===== SHADOWS: Remove large shadows, keep only shadow-sm or border =====
    ('shadow-xl', 'shadow-sm'),
    ('shadow-lg', 'shadow-sm'),
    ('shadow-md', 'shadow-sm'),
    ('shadow-2xl', 'shadow-sm'),

    # ===== GRAY -> SLATE: Unify to slate palette =====
    ('bg-gray-50', 'bg-slate-50'),
    ('bg-gray-100', 'bg-slate-100'),
    ('bg-gray-200', 'bg-slate-200'),
    ('bg-gray-300', 'bg-slate-300'),
    ('bg-gray-400', 'bg-slate-400'),
    ('bg-gray-500', 'bg-slate-500'),
    ('bg-gray-600', 'bg-slate-600'),
    ('bg-gray-700', 'bg-slate-700'),
    ('bg-gray-800', 'bg-slate-800'),
    ('bg-gray-900', 'bg-slate-900'),
    ('text-gray-50', 'text-slate-50'),
    ('text-gray-100', 'text-slate-100'),
    ('text-gray-200', 'text-slate-200'),
    ('text-gray-300', 'text-slate-300'),
    ('text-gray-400', 'text-slate-400'),
    ('text-gray-500', 'text-slate-500'),
    ('text-gray-600', 'text-slate-600'),
    ('text-gray-700', 'text-slate-700'),
    ('text-gray-800', 'text-slate-800'),
    ('text-gray-900', 'text-slate-900'),
    ('border-gray-50', 'border-slate-50'),
    ('border-gray-100', 'border-slate-100'),
    ('border-gray-200', 'border-slate-200'),
    ('border-gray-300', 'border-slate-300'),
    ('border-gray-400', 'border-slate-400'),
    ('border-gray-500', 'border-slate-500'),
    ('ring-gray-', 'ring-slate-'),
    ('divide-gray-', 'divide-slate-'),
    ('placeholder-gray-', 'placeholder-slate-'),

    # ===== FONT FAMILY: Outfit -> Inter via CSS var =====
    ("'Outfit'", "'Inter'"),
    ('"Outfit"', '"Inter"'),
    ('font-["Outfit"]', 'font-sans'),

    # ===== BRAND TEAL OVERRIDES for Navigation/Dark Surfaces =====
    # Nav bar: switch from teal (brand-900) to neutral dark (slate-900)
    ('bg-brand-900', 'bg-slate-900'),
    ('bg-brand-800/50', 'bg-slate-800/50'),
    ('bg-brand-800', 'bg-slate-800'),
    ('hover:bg-brand-800', 'hover:bg-slate-800'),
    ('border-brand-800', 'border-slate-800'),
    ('border-brand-500', 'border-slate-900'),

    # Active nav states
    ('text-brand-700', 'text-slate-900'),
    ('border-brand-600', 'border-slate-900'),
    ('bg-brand-700', 'bg-slate-900'),
    ('bg-brand-600', 'bg-slate-900'),
    ('bg-brand-500', 'bg-slate-700'),
    ('bg-brand-400', 'bg-slate-500'),
    ('bg-brand-300', 'bg-slate-400'),
    ('bg-brand-200', 'bg-slate-200'),
    ('bg-brand-100', 'bg-slate-100'),
    ('bg-brand-50/50', 'bg-slate-50/50'),
    ('bg-brand-50', 'bg-slate-50'),

    # Text brand colors -> neutral equivalents
    ('text-brand-800', 'text-slate-800'),
    ('text-brand-600', 'text-slate-700'),
    ('text-brand-500', 'text-slate-600'),
    ('text-brand-400', 'text-slate-500'),

    # Hover brand colors
    ('hover:text-brand-600', 'hover:text-slate-900'),
    ('hover:bg-brand-700', 'hover:bg-slate-800'),

    # Focus ring brand -> neutral
    ('ring-brand-500/20', 'ring-slate-950/10'),
    ('ring-brand-300', 'ring-slate-300'),
    ('ring-brand-200', 'ring-slate-200'),
    ('focus:border-brand-500', 'focus:border-slate-400'),
    ('focus:ring-brand-500/20', 'focus:ring-slate-950/10'),

    # Border brand
    ('border-brand-700', 'border-slate-700'),
    ('border-brand-600', 'border-slate-700'),
    ('border-brand-500', 'border-slate-400'),
    ('border-brand-200', 'border-slate-200'),
    ('border-brand-100', 'border-slate-100'),

    # Active states
    ('active:bg-brand-800', 'active:bg-slate-950'),

    # Misc brand references
    ('text-brand-700', 'text-slate-900'),
    ('data-[state=checked]:bg-brand-700', 'data-[state=checked]:bg-slate-900'),
    ('data-[state=checked]:border-brand-700', 'data-[state=checked]:border-slate-900'),
    ('hover:border-brand-500', 'hover:border-slate-400'),
    ('group-focus-within:text-brand-500', 'group-focus-within:text-slate-700'),

    # ===== BACKGROUND: Standardize main BGs =====
    ('bg-[#F3F4F6]', 'bg-white'),
    ('bg-[#f3f4f6]', 'bg-white'),
]

def apply_replacements(content):
    """Apply all simple string replacements."""
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    return content


def process_file(filepath):
    """Process a single file."""
    basename = os.path.basename(filepath)
    if basename in SKIP_FILES:
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    modified = apply_replacements(original)

    if modified != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified)
        return True
    return False


def main():
    files = get_all_tsx_ts_files()
    modified_count = 0
    total_count = len(files)

    print(f"Processing {total_count} files in {SRC_DIR}...")
    print("=" * 60)

    for filepath in files:
        rel_path = os.path.relpath(filepath, SRC_DIR)
        if process_file(filepath):
            print(f"  ✓ Modified: {rel_path}")
            modified_count += 1

    print("=" * 60)
    print(f"Done! Modified {modified_count}/{total_count} files.")


if __name__ == '__main__':
    main()
