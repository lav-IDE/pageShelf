/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary':    'var(--bg-primary)',
        'bg-secondary':  'var(--bg-secondary)',
        'bg-tertiary':   'var(--bg-tertiary)',
        'bg-sidebar':    'var(--bg-sidebar)',
        'surface':       'var(--surface)',
        'text-primary':  'var(--text-primary)',
        'text-secondary':'var(--text-secondary)',
        'text-muted':    'var(--text-muted)',
        'on-shelf':      'var(--text-on-shelf)',
        'accent':        'var(--accent)',
        'accent-hover':  'var(--accent-hover)',
        'border-warm':   'var(--border)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Lora"', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        'book':   '0 4px 24px var(--shadow)',
        'card':   '2px 2px 8px var(--shadow)',
        'folder': '0 2px 12px var(--shadow)',
      }
    }
  },
  plugins: [],
}
