const fs = require('fs');
const path = require('path');

const authPages = [
  '/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/Auth.tsx',
  '/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/Register.tsx',
  '/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/ForgotPassword.tsx',
  '/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/ResetPassword.tsx',
  '/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/Onboarding.tsx'
];

authPages.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove duplicate useTranslation hook
    let lines = content.split('\n');
    let seenTranslationHook = false;
    let filteredLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('const { t } = useTranslation()')) {
        if (!seenTranslationHook) {
          filteredLines.push(lines[i]);
          seenTranslationHook = true;
        }
      } else {
        filteredLines.push(lines[i]);
      }
    }
    
    fs.writeFileSync(file, filteredLines.join('\n'));
    console.log(`✓ Fixed ${path.basename(file)}`);
  }
});
