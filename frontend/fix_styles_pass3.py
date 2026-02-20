#!/usr/bin/env python3
"""
Third pass: Remove remaining uppercase, font-bold patterns from page/component files.
More targeted to avoid breaking things like BIC input fields.
"""

import os
import re
import glob

SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')

SKIP_FILES = {'index.css'}

def get_all_tsx_files():
    files = []
    for ext in ['tsx']:
        files.extend(glob.glob(os.path.join(SRC_DIR, '**', f'*.{ext}'), recursive=True))
    return sorted(files)

REPLACEMENTS = [
    # font-bold -> font-medium in class strings (shadcn uses font-medium)
    ('font-bold', 'font-medium'),
    
    # Remove uppercase from labels, headings, buttons (but NOT from CSS classes or data values like BIC)
    # We'll do this with targeted patterns
    (' uppercase', ''),
    
    # tracking-[0.2em] -> remove
    (' tracking-[0.2em]', ''),
    
    # text-[12px] -> text-sm
    ('text-[12px]', 'text-sm'),
    ('text-[11px]', 'text-sm'),
    
    # rounded-full on filter pills -> rounded-sm
    ('rounded-full transition-all border', 'rounded-sm transition-all border'),
    
    # shadow-sm shadow-brand-500/20 -> just nothing (cleanup leftover brand shadow)
    (' shadow-brand-500/20', ''),
    (' shadow-brand-700/20', ''),
    (' shadow-emerald-600/20', ''),
    
    # active:scale-95 -> remove (shadcn doesn't use scale transforms)
    (' active:scale-95', ''),
    (' transform hover:scale-105', ''),
    (' transform hover:scale-110', ''),
    
    # tracking-tighter -> tracking-tight (consistent)
    ('tracking-tighter', 'tracking-tight'),
    
    # Cleanup
    ('  ', ' '),
]

def apply_replacements(content):
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    content = re.sub(r'  +', ' ', content)
    return content

def process_file(filepath):
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
    files = get_all_tsx_files()
    modified_count = 0
    
    print(f"Third pass: Processing {len(files)} TSX files...")
    print("=" * 60)
    
    for filepath in files:
        rel_path = os.path.relpath(filepath, SRC_DIR)
        if process_file(filepath):
            print(f"  ✓ Modified: {rel_path}")
            modified_count += 1
    
    print("=" * 60)
    print(f"Done! Modified {modified_count}/{len(files)} files.")

if __name__ == '__main__':
    main()
