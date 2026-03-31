// DEPRECATED: use @/components/common/ConfirmModal instead
export { default } from '@/components/common/ConfirmModal';
export type { ConfirmModalProps, ConfirmModalVariant } from '@/components/common/ConfirmModal';

// Re-export ConfirmationVariant as an alias so ConfirmationContext.tsx keeps compiling
// without changes. The canonical type is ConfirmModalVariant.
export type ConfirmationVariant = import('@/components/common/ConfirmModal').ConfirmModalVariant | 'info' | 'success';
