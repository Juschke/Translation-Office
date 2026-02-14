---
description: How to use shadcn/ui components in the Translation Office frontend
---

# shadcn/ui Component Usage Guide

## Setup (Already Done)
- Path aliases: `@/` → `./src/` (configured in `tsconfig.app.json` and `vite.config.ts`)
- Utility: `@/lib/utils.ts` exports `cn()` function
- Dependencies: All Radix UI primitives, `class-variance-authority`, `tailwindcss-animate`, `cmdk`, `sonner`

## UI Components Location
All shadcn/ui components live in `src/components/ui/`. Import from:
```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// or barrel import:
import { Button, Input, Dialog } from '@/components/ui'
```

## Available Components

| Component | File | Replaces |
|-----------|------|----------|
| `Button` | `ui/button.tsx` | `common/Button.tsx` |
| `Input` | `ui/input.tsx` | `common/Input.tsx` (input mode) |
| `Textarea` | `ui/textarea.tsx` | `common/Input.tsx` (isTextArea mode) |
| `Select` | `ui/select.tsx` | `common/Input.tsx` (isSelect mode) |
| `Label` | `ui/label.tsx` | inline labels |
| `Checkbox` | `ui/checkbox.tsx` | `common/Checkbox.tsx` |
| `Switch` | `ui/switch.tsx` | `common/Switch.tsx` |
| `Dialog` | `ui/dialog.tsx` | manual modal overlays |
| `AlertDialog` | `ui/alert-dialog.tsx` | `common/ConfirmDialog.tsx`, `common/ConfirmModal.tsx`, `modals/ConfirmModal.tsx`, `modals/ConfirmationModal.tsx` |
| `Tabs` | `ui/tabs.tsx` | inline tab implementations |
| `Badge` | `ui/badge.tsx` | inline badge styles |
| `Card` | `ui/card.tsx` | inline card containers |
| `Table` | `ui/table.tsx` | basic table markup |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | custom dropdown menus |
| `Avatar` | `ui/avatar.tsx` | inline avatar styles |
| `Tooltip` | `ui/tooltip.tsx` | title attributes |
| `ScrollArea` | `ui/scroll-area.tsx` | `.custom-scrollbar` class |
| `Separator` | `ui/separator.tsx` | `<div className="border-t">` |
| `Skeleton` | `ui/skeleton.tsx` | `common/Skeleton.tsx` |

## Backward Compatibility
The old components (`common/Button.tsx`, `common/Input.tsx`, etc.) are now thin wrappers around the new shadcn/ui components. All existing imports continue to work. New code should import directly from `@/components/ui/`.

## Button Variant Mapping
Old → New:
- `primary` → `default`
- `secondary` → `secondary`
- `danger` → `destructive`
- `ghost` → `ghost`
- `outline` → `outline`

## Usage Examples

### Button
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button isLoading>Saving...</Button>
```

### AlertDialog (replaces ConfirmDialog/ConfirmModal)
```tsx
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel
} from '@/components/ui/alert-dialog'

<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Löschen?</AlertDialogTitle>
      <AlertDialogDescription>
        Diese Aktion kann nicht rückgängig gemacht werden.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Löschen
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Tabs
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Übersicht</TabsTrigger>
    <TabsTrigger value="files">Dateien</TabsTrigger>
    <TabsTrigger value="finances">Finanzen</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="files">...</TabsContent>
  <TabsContent value="finances">...</TabsContent>
</Tabs>
```

## Design Tokens
All components use these consistent values:
- **Border radius**: None (sharp edges, matching brand design)
- **Font**: Outfit (inherited from body)
- **Colors**: `brand-*` palette (teal-based)
- **Focus ring**: `ring-brand-500/30`
- **Labels**: `text-[11px] font-bold uppercase tracking-wider text-slate-500`
