import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';

// Polyfill for TextEncoder/TextDecoder
Object.assign(global, { TextDecoder, TextEncoder });

// Mock wagmi config
const mockConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http()
  }
});

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useConfig: () => mockConfig,
    useAccount: () => ({
      address: '0x123',
      isConnected: true
    }),
    useConnect: () => ({
      connect: vi.fn(),
      connectors: []
    }),
    useDisconnect: () => ({
      disconnect: vi.fn()
    }),
    useContractRead: () => ({
      data: undefined,
      isLoading: false,
      error: null
    }),
    useContractWrite: () => ({
      writeAsync: vi.fn(),
      data: undefined,
      isLoading: false,
      error: null
    })
  };
});

// Mock Performance API
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn().mockReturnValue({ duration: 50 }),
  getEntriesByName: vi.fn().mockReturnValue([{ duration: 50 }]),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock FileReader
class MockFileReader {
  static EMPTY = 0;
  static LOADING = 1;
  static DONE = 2;
  
  EMPTY = MockFileReader.EMPTY;
  LOADING = MockFileReader.LOADING;
  DONE = MockFileReader.DONE;
  
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  readAsText(this: FileReader, file: Blob) {
    const event = new ProgressEvent('load');
    Object.defineProperty(this, 'result', { value: 'mocked file content', writable: false });
    this.onload && this.onload(event as ProgressEvent<FileReader>);
  }
}

global.FileReader = MockFileReader as any;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  value: MockResizeObserver,
});

// Mock fetch
global.fetch = vi.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockPerformance.mark.mockClear();
  mockPerformance.measure.mockClear();
  mockPerformance.getEntriesByName.mockClear();
  mockPerformance.clearMarks.mockClear();
  mockPerformance.clearMeasures.mockClear();
});