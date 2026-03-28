#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Adding missing translation keys...${NC}"

# Add keys to English file
EN_FILE="/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json"
DE_FILE="/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json"

# Add to auth section if not present
if ! grep -q '"welcome_back"' "$EN_FILE"; then
  echo -e "${GREEN}Adding auth section keys to English...${NC}"
  
  # Add guest portal keys
  jq '.guest_portal = {
    "title": "Project Portal",
    "access_denied": "Access Denied",
    "invalid_link": "Project could not be loaded. Please check the link.",
    "loading": "Loading project..."
  }' "$EN_FILE" > "${EN_FILE}.tmp" && mv "${EN_FILE}.tmp" "$EN_FILE"
  
  # Add login page specific keys
  jq '.auth.welcome_back = "Welcome back" | .auth.two_factor_title = "2FA Confirmation" | .auth.two_factor_prompt = "Please enter your authenticator code." | .auth.login_prompt = "Sign in to access your dashboard." | .auth.invalid_credentials = "Invalid email or password." | .auth.confirmation_code_required = "Please enter the confirmation code." | .auth.authenticator_code = "Authenticator Code"' "$EN_FILE" > "${EN_FILE}.tmp" && mv "${EN_FILE}.tmp" "$EN_FILE"
fi

# Add to German file
if ! grep -q '"welcome_back"' "$DE_FILE"; then
  echo -e "${GREEN}Adding auth section keys to German...${NC}"
  
  # Add guest portal keys
  jq '.guest_portal = {
    "title": "Projektportal",
    "access_denied": "Zugriff verweigert",
    "invalid_link": "Das Projekt konnte nicht geladen werden. Bitte prüfen Sie den Link.",
    "loading": "Projekt wird geladen..."
  }' "$DE_FILE" > "${DE_FILE}.tmp" && mv "${DE_FILE}.tmp" "$DE_FILE"
  
  # Add login page specific keys
  jq '.auth.welcome_back = "Willkommen zurück" | .auth.two_factor_title = "2FA Bestätigung" | .auth.two_factor_prompt = "Bitte geben Sie Ihren Authenticator-Code ein." | .auth.login_prompt = "Melden Sie sich an, um auf Ihr Dashboard zuzugreifen." | .auth.invalid_credentials = "Ungültige E-Mail-Adresse oder Passwort." | .auth.confirmation_code_required = "Bitte geben Sie den Bestätigungscode ein." | .auth.authenticator_code = "Authenticator-Code"' "$DE_FILE" > "${DE_FILE}.tmp" && mv "${DE_FILE}.tmp" "$DE_FILE"
fi

echo -e "${GREEN}✓ Translation keys added successfully!${NC}"
