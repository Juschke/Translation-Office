#!/bin/bash

FILE="/home/oem/Desktop/Translation-Office/frontend/src/pages/auth/Auth.tsx"

# Add useTranslation to LoginForm
sed -i '/^const LoginForm = /a\    const { t } = useTranslation();' "$FILE"

# Add useTranslation to RegisterForm  
sed -i '/^const RegisterForm = /a\    const { t } = useTranslation();' "$FILE"

# Replace hardcoded strings in LoginForm
sed -i "s/>Passwort</>{ t('auth.password') }</g" "$FILE"
sed -i "s/ Vergessen\?$/ {t('auth.forgot_password_link')}/g" "$FILE"
sed -i "s/'Verifiziere\.\.\.'/{ showTwoFactor ? t('auth.verifying') : t('auth.signing_in') }/g" "$FILE"
sed -i "s/'Anmelden\.\.\.'/{ showTwoFactor ? t('auth.verifying') : t('auth.signing_in') }/g" "$FILE"
sed -i "s/'Bestätigen'/{ showTwoFactor ? t('auth.confirming') : t('auth.sign_in') }/g" "$FILE"
sed -i "s/'Anmelden'/{ t('auth.sign_in') }/g" "$FILE"

# Replace RegisterForm strings
sed -i "s/>Vollständiger Name</>{ t('auth.full_name') }</g" "$FILE"
sed -i "s/>E-Mail-Adresse</>{ t('auth.email_address') }</g" "$FILE"
sed -i "s/>Passwort bestätigen</>{ t('auth.confirm_password_label') }</g" "$FILE"
sed -i "s/'Konto erstellen'/{ t('auth.sign_up') }/g" "$FILE"

echo "✓ Auth.tsx fixed!"
