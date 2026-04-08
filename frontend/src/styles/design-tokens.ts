// Dokonect V3 Design System Tokens

export const colors = {
    primary: '#0EA5E9',    // Sky blue - actions, CTAs
    success: '#10B981',    // Green - delivered, accepted, online
    warning: '#F59E0B',    // Amber - pending, in-transit
    danger: '#EF4444',     // Red - failed, rejected, low stock
    darkBg: '#0F172A',     // Dark background (driver app)
    lightBg: '#F8FAFC',    // Light background
    cardBg: '#FFFFFF',     // Card background
    text: {
        primary: '#0F172A',
        secondary: '#64748B',
        light: '#94A3B8',
        dark: '#1E293B',
    },
    border: '#E2E8F0',
    hover: '#F1F5F9',
};

export const typography = {
    fontFamily: {
        heading: '"Plus Jakarta Sans", sans-serif',
        body: '"Inter", sans-serif',
        mono: '"JetBrains Mono", monospace',
    },
    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem',// 30px
        '4xl': '2.25rem', // 36px
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
};

export const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
};

export const borderRadius = {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
};

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};

export const transitions = {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
};
