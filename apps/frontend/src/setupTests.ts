import '@testing-library/jest-dom/vitest';

// antd's responsive observer (Grid/Row/Col, breakpoints) needs matchMedia, which jsdom lacks.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
