import { readFileSync } from 'fs';
import { join } from 'path';

// Read the built component bundle
let componentJS = '';
try {
  // In development, read from dist; in production, bundle will be embedded
  componentJS = readFileSync(join(process.cwd(), 'web/dist/cod-loadout-components.umd.js'), 'utf-8');
} catch (error) {
  console.error('Warning: Component bundle not found. Run `npm run build:web` first.');
  componentJS = '// Component bundle not built yet\nconsole.error("Components not loaded");';
}

// Base HTML template for widgets
const createWidgetTemplate = (componentName: string, rootId: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    #${rootId} {
      width: 100%;
      height: 100%;
    }

    /* COD Theme Colors */
    .bg-cod-black { background-color: #0a0a0a; }
    .bg-cod-gray { background-color: #1a1a1a; }
    .bg-cod-orange { background-color: #ff6b00; }
    .text-cod-orange { color: #ff6b00; }
    .text-cod-blue { color: #00d4ff; }
    .text-cod-green { color: #00ff88; }
    .border-cod-orange { border-color: #ff6b00; }
    .border-cod-gray { border-color: #2a2a2a; }

    /* Tailwind-like utilities */
    .flex { display: flex; }
    .grid { display: grid; }
    .hidden { display: none; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .p-8 { padding: 2rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .ml-16 { margin-left: 4rem; }
    .mt-8 { margin-top: 2rem; }
    .pt-6 { padding-top: 1.5rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-md { border-radius: 0.375rem; }
    .border { border-width: 1px; }
    .border-t { border-top-width: 1px; }
    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    .text-2xl { font-size: 1.5rem; line-height: 2rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .text-white { color: #ffffff; }
    .text-gray-300 { color: #d1d5db; }
    .text-gray-400 { color: #9ca3af; }
    .text-gray-500 { color: #6b7280; }
    .bg-gray-700 { background-color: #374151; }
    .bg-gray-800 { background-color: #1f2937; }
    .bg-gray-900 { background-color: #111827; }
    .max-w-2xl { max-width: 42rem; }
    .max-w-4xl { max-width: 56rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .cursor-pointer { cursor: pointer; }
    .transition-colors { transition-property: color, background-color, border-color; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .hover\\:bg-orange-600:hover { background-color: #ea580c; }
    .hover\\:bg-cod-gray\\/70:hover { background-color: rgba(26, 26, 26, 0.7); }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
    .from-gray-900 { --tw-gradient-from: #111827; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(17, 24, 39, 0)); }
    .to-gray-800 { --tw-gradient-to: #1f2937; }
    .from-cod-black { --tw-gradient-from: #0a0a0a; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(10, 10, 10, 0)); }
    .to-cod-gray { --tw-gradient-to: #1a1a1a; }

    @media (min-width: 768px) {
      .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (min-width: 1024px) {
      .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <div id="${rootId}"></div>

  <script>
    ${componentJS}

    // Initialize the component when ready
    (function() {
      function initComponent() {
        const root = document.getElementById('${rootId}');
        if (root && window.CODLoadoutComponents && window.CODLoadoutComponents.${componentName}) {
          const Component = window.CODLoadoutComponents.${componentName};

          // Create React element and render
          if (window.CODLoadoutComponents.React && window.CODLoadoutComponents.ReactDOM) {
            const React = window.CODLoadoutComponents.React;
            const ReactDOM = window.CODLoadoutComponents.ReactDOM;
            const reactRoot = ReactDOM.createRoot(root);
            reactRoot.render(React.createElement(Component));
          }
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponent);
      } else {
        initComponent();
      }
    })();
  </script>
</body>
</html>
`.trim();

// Widget templates
export const WIDGET_TEMPLATES = {
  'ui://widget/loadout-card.html': createWidgetTemplate('LoadoutCard', 'loadout-root'),
  'ui://widget/meta-tier-list.html': createWidgetTemplate('MetaTierList', 'meta-root'),
  'ui://widget/counter-suggestions.html': createWidgetTemplate('CounterSuggestions', 'counter-root'),
  'ui://widget/my-loadouts.html': createWidgetTemplate('MyLoadouts', 'loadouts-root'),
  'ui://widget/playstyle-profile.html': createWidgetTemplate('PlaystyleProfile', 'playstyle-root'),
  'ui://widget/weapon-list.html': createWidgetTemplate('WeaponList', 'weapons-root'),
};

export function getWidgetTemplate(uri: string): string | null {
  return WIDGET_TEMPLATES[uri] || null;
}

export function listWidgetResources() {
  return Object.keys(WIDGET_TEMPLATES).map(uri => ({
    uri,
    name: uri.split('/').pop()?.replace('.html', '') || uri,
    description: `UI component for ${uri.split('/').pop()?.replace('.html', '').replace(/-/g, ' ')}`,
    mimeType: 'text/html+skybridge',
  }));
}
