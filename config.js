/* ============================================================
   Code Playground - Tailwind Configuration
   Loaded after the Tailwind CDN script, before any UI renders.
   ============================================================ */

tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'studio-bg':       '#0d1117',
                'studio-sidebar':  '#161b22',
                'studio-panel':    '#21262d',
                'studio-border':   '#30363d',
                'studio-text':     '#c9d1d9',
                'studio-muted':    '#8b949e'
            },
            fontFamily: {
                'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                'mono': ['Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
            }
        }
    }
};
