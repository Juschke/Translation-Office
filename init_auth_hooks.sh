#!/bin/bash

FILES=(
  "/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/Auth.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/Register.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/ForgotPassword.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/ResetPassword.tsx"
  "/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/Onboarding.tsx"
)

for file in "${FILES[@]}"; do
  if grep -q "const.*Page.*= ()" "$file" || grep -q "const.*Page.*= () =>" "$file"; then
    sed -i '/^const.*Page.*= ()/a\    const { t } = useTranslation();' "$file"
    sed -i '/^const.*Page.*= () =>/a\    const { t } = useTranslation();' "$file"
  elif grep -q "^const [A-Za-z].*= () => {" "$file"; then
    sed -i '/^const [A-Za-z].*= () => {/a\    const { t } = useTranslation();' "$file"
  fi
done

echo "✓ Hooks initialized!"
