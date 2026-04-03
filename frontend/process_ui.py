import os
import re

directories = [
    r'c:\xampp\htdocs\Translation-Office\frontend\src\components\projects',
    r'c:\xampp\htdocs\Translation-Office\frontend\src\components\modals',
    r'c:\xampp\htdocs\Translation-Office\frontend\src\pages'
]

patterns = {
    r'\buppercase\b': '',
    r'\btracking-(wider|widest|tight|tighter|wide|normal)\b': '',
    r'\btext-2xs\b': 'text-sm'
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = content
    for pattern, replacement in patterns.items():
        modified = re.sub(pattern, replacement, modified)
    
    # Cleanup extra spaces in className strings
    # Match className="xxx" and clean up spaces within it
    def cleanup_spaces(match):
        res = match.group(0)
        # remove multiple spaces
        res = re.sub(r'\s+', ' ', res)
        # remove space after " or before "
        res = res.replace('=" ', '="').replace(' "', '"')
        return res

    modified = re.compile(r'className="[^"]*"').sub(cleanup_spaces, modified)
    # also handle multi-line template literals or strings
    # but regex is hard for that.
    
    if content != modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Updated {filepath}")

for directory in directories:
    if not os.path.exists(directory): continue
    for root, dirs, files in os.walk(directory):
        for filename in files:
            if filename.endswith('.tsx') or filename.endswith('.ts'):
                process_file(os.path.join(root, filename))
