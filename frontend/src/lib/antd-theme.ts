import type { ThemeConfig } from 'antd';
import { BRAND, STATUS, NEUTRAL, BORDER, TEXT, BG, TYPOGRAPHY, RADIUS, SHADOW } from './theme';

export const antdTheme: ThemeConfig = {
    token: {
        // Brand colors
        colorPrimary:       BRAND.primary,
        colorPrimaryHover:  BRAND.primaryHover,
        colorPrimaryActive: BRAND.primaryActive,
        colorLink:          BRAND.primary,
        colorLinkHover:     BRAND.primaryHover,

        // Semantic
        colorSuccess: STATUS.success,
        colorWarning: STATUS.warning,
        colorError:   STATUS.danger,
        colorInfo:    BRAND.primary,

        // Typography
        fontFamily: TYPOGRAPHY.fontSans,
        fontSize:   TYPOGRAPHY.fontSizeBase,

        // Border radius — Bootstrap 3 style (small)
        borderRadius:   RADIUS.sm,
        borderRadiusSM: RADIUS.xs,
        borderRadiusLG: RADIUS.md,

        // Border & background
        colorBorder:          BORDER.subtle,
        colorBorderSecondary: BORDER.secondary,
        colorBgContainer:     BG.card,
        colorBgElevated:      BG.card,

        // Text
        colorText:            TEXT.secondary,
        colorTextSecondary:   TEXT.muted,
        colorTextPlaceholder: TEXT.placeholder,

        // Shadow (Bootstrap 3 style)
        boxShadow:          SHADOW.sm,
        boxShadowSecondary: SHADOW.md,

        // Motion
        motionDurationSlow: '0.2s',
        motionDurationMid:  '0.15s',
        motionDurationFast: '0.1s',
    },

    components: {
        Table: {
            // Header
            headerBg:           BRAND.tableHeader,
            headerColor:        BRAND.primary,
            headerSortActiveBg: BRAND.tableHeaderSort,
            headerSortHoverBg:  BRAND.tableHeaderHover,
            headerSplitColor:   BRAND.tableHeaderSplit,
            headerBorderRadius: RADIUS.none,

            // Rows
            rowHoverBg:         BRAND.primaryLight,
            rowSelectedBg:      BRAND.primaryMid,
            rowSelectedHoverBg: BRAND.tableRowSelHover,
            rowExpandedBg:      BRAND.tableRowExpanded,

            // Cells
            cellPaddingBlock:  9,
            cellPaddingInline: 12,

            // Border
            borderColor:  BORDER.subtle,
            footerBg:     BRAND.tableFooter,
            footerColor:  BRAND.primary,
        },

        Button: {
            primaryColor:       TEXT.inverse,
            defaultBorderColor: NEUTRAL.gray300,
            defaultColor:       NEUTRAL.gray800,
            defaultBg:          BG.card,
            primaryShadow:      SHADOW.primary,
            defaultShadow:      '0 1px 2px rgba(0,0,0,0.08)',
            dangerShadow:       SHADOW.primary,
            contentFontSize:    TYPOGRAPHY.fontSizeBase,
            paddingInline:      14,
            paddingBlock:       5,
        },

        Input: {
            borderRadius:  RADIUS.sm,
            paddingBlock:  5,
            paddingInline: 10,
            colorBorder:   BORDER.subtle,
        },

        Select: {
            borderRadius: RADIUS.sm,
        },

        Pagination: {
            itemBg:            BG.card,
            itemActiveBg:      BRAND.primary,
            colorPrimary:      BRAND.primary,
            colorPrimaryHover: BRAND.primaryHover,
        },

        Dropdown: {
            borderRadius: RADIUS.sm,
        },

        Tag: {
            borderRadius:  RADIUS.sm,
            colorBorderBg: BORDER.subtle,
        },

        Badge: {
            colorPrimary: BRAND.primary,
        },

        Modal: {
            borderRadius:    RADIUS.md,
            headerBg:        BRAND.modalHeader,
            colorBgElevated: BG.card,
        },

        Tooltip: {
            borderRadius: RADIUS.sm,
        },
    },
};
