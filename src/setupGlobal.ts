// Polyfills that must run before other imports
// Ensure libraries that reference `global` (Node-style) work in the browser
declare global {
  interface Window {
    global?: unknown;
  }
}

const w = window as unknown as Window & Record<string, unknown>;
if (typeof w.global === "undefined") {
  // assign window as the global object for libs expecting `global`
  (w as unknown as { global?: unknown }).global = window;
}

export {};
