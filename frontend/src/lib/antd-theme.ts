import type { ThemeConfig } from 'antd';

// Brand teal colors (from CSS vars)
const TEAL_PRIMARY   = '#1B4D4F';
const TEAL_HOVER     = '#235e62';
const TEAL_ACTIVE    = '#133d3f';
const TEAL_LIGHT_BG  = '#eaf4f3';
const TEAL_SELECTED  = '#d0eae8';

export const antdTheme: ThemeConfig = {
    token: {
        // Brand colors
        colorPrimary:      TEAL_PRIMARY,
        colorPrimaryHover: TEAL_HOVER,
        colorPrimaryActive: TEAL_ACTIVE,
        colorLink:         TEAL_PRIMARY,
        colorLinkHover:    TEAL_HOVER,

        // Semantic
        colorSuccess: '#449d44',
        colorWarning: '#ec971f',
        colorError:   '#c9302c',
        colorInfo:    TEAL_PRIMARY,

        // Typography
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        fontSize: 13,

        // Border radius — Bootstrap 3 style (small)
        borderRadius:   3,
        borderRadiusSM: 2,
        borderRadiusLG: 4,

        // Border & background
        colorBorder:          '#D1D9D8',
        colorBorderSecondary: '#e0eaea',
        colorBgContainer:     '#ffffff',
        colorBgElevated:      '#ffffff',

        // Text
        colorText:          '#2d3535',
        colorTextSecondary: '#626B6A',
        colorTextPlaceholder: '#a0aeae',

        // Shadow (Bootstrap 3 style)
        boxShadow:          '0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
        boxShadowSecondary: '0 2px 6px rgba(0,0,0,0.12)',

        // Motion
        motionDurationSlow: '0.2s',
        motionDurationMid:  '0.15s',
        motionDurationFast: '0.1s',
    },

    components: {
        Table: {
            // Header
            headerBg:            '#e4efef',
            headerColor:         TEAL_PRIMARY,
            headerSortActiveBg:  '#d8e8e8',
            headerSortHoverBg:   '#dff0ef',
            headerSplitColor:    '#b8cecd',
            headerBorderRadius:  0,

            // Rows
            rowHoverBg:         TEAL_LIGHT_BG,
            rowSelectedBg:      TEAL_SELECTED,
            rowSelectedHoverBg: '#b8dbd8',
            rowExpandedBg:      '#f4fafa',

            // Cells
            cellPaddingBlock:   9,
            cellPaddingInline:  12,

            // Border
            borderColor:        '#D1D9D8',
            footerBg:           '#f4f9f9',
            footerColor:        TEAL_PRIMARY,
        },

        Button: {
            primaryColor:  '#ffffff',
            defaultBorderColor: '#cccccc',
            defaultColor:       '#333333',
            defaultBg:          '#ffffff',
            primaryShadow:   'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(0,0,0,0.12)',
            defaultShadow:   '0 1px 2px rgba(0,0,0,0.08)',
            dangerShadow:    'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(0,0,0,0.12)',
            contentFontSize: 13,
            paddingInline:   14,
            paddingBlock:    5,
        },

        Input: {
            borderRadius:  3,
            paddingBlock:  5,
            paddingInline: 10,
            colorBorder:   '#D1D9D8',
        },

        Select: {
            borderRadius: 3,
        },

        Pagination: {
            itemBg:       '#ffffff',
            itemActiveBg: TEAL_PRIMARY,
            colorPrimary: TEAL_PRIMARY,
            colorPrimaryHover: TEAL_HOVER,
        },

        Dropdown: {
            borderRadius: 3,
        },

        Tag: {
            borderRadius:     3,
            colorBorderBg:    '#D1D9D8',
        },

        Badge: {
            colorPrimary: TEAL_PRIMARY,
        },

        Modal: {
            borderRadius:       4,
            headerBg:           '#f4f9f9',
            colorBgElevated:    '#ffffff',
        },

        Tooltip: {
            borderRadius: 3,
        },
    },
};
