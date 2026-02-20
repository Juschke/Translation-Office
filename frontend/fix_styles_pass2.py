#!/usr/bin/env python3
"""
Second-pass style fix: Remove font-black, excessive uppercase tracking patterns
throughout the codebase for a clean shadcn look.
"""

import os
import re
import glob

SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')

SKIP_FILES = {'index.css'}

def get_all_tsx_files():
    files = []
    for ext in ['tsx', 'ts']:
        files.extend(glob.glob(os.path.join(SRC_DIR, '**', f'*.{ext}'), recursive=True))
    return sorted(files)

# Simple replacements
REPLACEMENTS = [
    # font-black -> font-semibold (shadcn never uses font-black)
    ('font-black', 'font-semibold'),
    
    # tracking-widest -> (remove, too wide for shadcn)
    (' tracking-widest', ''),
    
    # text-[11px] font-semibold uppercase tracking-wider -> text-sm font-medium (clean label style)
    ('text-[11px] font-semibold text-slate-500 uppercase tracking-wider', 'text-sm font-medium text-slate-500'),
    ('text-[11px] font-semibold uppercase tracking-wider', 'text-sm font-medium'),
    
    # text-[10px] patterns -> text-xs
    ('text-[10px]', 'text-xs'),
    ('text-[9px]', 'text-xs'),
    ('text-[8px]', 'text-xs'),
    
    # uppercase tracking-wider -> remove for body text
    (' uppercase tracking-wider', ''),
    (' uppercase tracking-wide', ''),
    (' uppercase tracking-tight', ''),
    
    # Shadow cleanup: remove shadow-sm from inputs (shadcn inputs have no shadow)
    # Already handled in component files
    
    # Remaining font-semibold on label elements  
    ('text-[11px] font-semibold', 'text-sm font-medium'),
    
    # opacity-50 on icons -> just use text color
    # Already handled
    
    # bg-slate-50/50 header backgrounds -> clean
    ('bg-slate-50/50', 'bg-transparent'),
    
    # Cleanup double spaces from removals
    ('  ', ' '),
]

def apply_replacements(content):
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    # Clean up any resulting double spaces in class strings
    # Simple pattern: multiple spaces -> single space
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
    
    print(f"Second pass: Processing {len(files)} files...")
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
