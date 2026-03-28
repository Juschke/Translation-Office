#!/bin/bash

cd /home/oem/Desktop/Translation-Office/frontend/src

echo "🔄 Initialisiere useTranslation Hooks in Komponenten..."

# Function to add hook initialization
init_hook() {
    local file="$1"
    local component_name=$(grep -o "const \w\+ = " "$file" | head -1 | sed 's/const \| = //g')
    
    if [ -z "$component_name" ]; then
        component_name=$(grep -o "export.*function \w\+" "$file" | sed 's/export.*function //')
    fi
    
    if [ -z "$component_name" ]; then
        return
    fi
    
    # Überspringe wenn Hook bereits initialisiert
    if grep -A5 "const $component_name" "$file" | grep -q "const { t } = useTranslation()"; then
        return
    fi
    
    # Finde die Component-Definition
    local line_num=$(grep -n "const $component_name\|export.*function $component_name\|export default $component_name" "$file" | head -1 | cut -d: -f1)
    
    if [ ! -z "$line_num" ]; then
        # Finde die erste Zeile nach der Component-Definition mit useState/useEffect/useQuery
        local insert_line=$((line_num + 1))
        while [ $insert_line -lt $(wc -l < "$file") ]; do
            local content=$(sed -n "${insert_line}p" "$file")
            if [[ "$content" =~ (useState|useEffect|useQuery|useParams|useLocation|useNavigate|useAuth) ]]; then
                sed -i "${insert_line}i\\    const { t } = useTranslation();" "$file"
                break
            fi
            insert_line=$((insert_line + 1))
            if [ $insert_line -gt $((line_num + 20)) ]; then
                break
            fi
        done
    fi
}

# Pages aktualisieren
for file in pages/Billing.tsx pages/VerifyEmail.tsx pages/CustomerDetail.tsx; do
    [ -f "$file" ] && init_hook "$file" && echo "✅ $file"
done

# Settings Tabs
for file in components/settings/*.tsx; do
    [ -f "$file" ] && init_hook "$file" && echo "✅ $file"
done

# Modals
for file in components/modals/*.tsx; do
    [ -f "$file" ] && init_hook "$file" && echo "✅ $file"
done

echo "✅ Initialization complete!"

