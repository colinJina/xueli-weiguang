import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

vi.stubGlobal(
  "ResizeObserver",
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

Object.assign(Element.prototype, {
  scrollIntoView: vi.fn(),
  hasPointerCapture: () => false,
  setPointerCapture: vi.fn(),
  releasePointerCapture: vi.fn(),
});
