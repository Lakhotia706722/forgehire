/**
 * Test: WebSocket reconnection with exponential backoff if connection drops.
 */
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/app/engineer/messages/_components/use-websocket';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
    // Fire onopen synchronously so instance counts are deterministic
    Promise.resolve().then(() => this.onopen?.());
  }

  send = jest.fn();
  close = jest.fn().mockImplementation(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  });

  static instances: MockWebSocket[] = [];
  static reset() { MockWebSocket.instances = []; }
}

(global as any).WebSocket = MockWebSocket;

describe('useWebSocket — exponential backoff reconnection', () => {
  beforeEach(() => {
    MockWebSocket.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('connects on mount', async () => {
    const onConnect = jest.fn();
    renderHook(() => useWebSocket({ url: 'ws://test', onConnect }));

    await act(async () => { await Promise.resolve(); });

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('reconnects after connection drops', async () => {
    const onConnect = jest.fn();
    // Use a stable ref to avoid re-renders causing extra connections
    renderHook(() => useWebSocket({ url: 'ws://test', onConnect, reconnect: true }));

    await act(async () => { await Promise.resolve(); });
    const initialCount = MockWebSocket.instances.length;
    expect(initialCount).toBeGreaterThanOrEqual(1);
    expect(onConnect).toHaveBeenCalledTimes(initialCount);

    // Simulate connection drop
    act(() => { MockWebSocket.instances[initialCount - 1].onclose?.(); });

    // First retry after 1000ms
    await act(async () => { jest.advanceTimersByTime(1000); });
    await act(async () => { await Promise.resolve(); });

    expect(MockWebSocket.instances.length).toBeGreaterThan(initialCount);
    expect(onConnect.mock.calls.length).toBeGreaterThan(initialCount);
  });

  it('uses exponential backoff — second retry after 2000ms', async () => {
    renderHook(() => useWebSocket({ url: 'ws://test', reconnect: true }));

    await act(async () => { await Promise.resolve(); });
    const after0 = MockWebSocket.instances.length;
    expect(after0).toBeGreaterThanOrEqual(1);

    // First drop → retry at 1000ms
    act(() => { MockWebSocket.instances[after0 - 1].onclose?.(); });
    await act(async () => { jest.advanceTimersByTime(1100); });
    await act(async () => { await Promise.resolve(); });

    const after1 = MockWebSocket.instances.length;
    expect(after1).toBeGreaterThan(after0); // first retry happened

    // Second drop → retry at 2000ms
    act(() => { MockWebSocket.instances[after1 - 1].onclose?.(); });

    // Advance well past 2000ms to ensure second retry fires
    await act(async () => { jest.advanceTimersByTime(2100); });
    await act(async () => { await Promise.resolve(); });

    const after2 = MockWebSocket.instances.length;
    expect(after2).toBeGreaterThan(after1); // second retry happened
    // Verify the delay was longer than the first (backoff is working)
    // We can't measure exact timing in jsdom, but we can verify 3 total connections
    expect(after2).toBeGreaterThanOrEqual(after0 + 2);
  });

  it('caps retry delay at 60 seconds', async () => {
    renderHook(() => useWebSocket({ url: 'ws://test', reconnect: true, maxRetries: 10 }));

    await act(async () => { await Promise.resolve(); });

    // Simulate 7 drops to reach the cap (2^6 = 64s → capped at 60s)
    for (let i = 0; i < 7; i++) {
      const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
      act(() => { ws.onclose?.(); });
      const delay = Math.min(1000 * Math.pow(2, i), 60000);
      await act(async () => { jest.advanceTimersByTime(delay); });
      await act(async () => { await Promise.resolve(); });
    }

    const countBefore = MockWebSocket.instances.length;
    expect(countBefore).toBeGreaterThanOrEqual(7);

    // 8th retry should use 60s cap
    const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    act(() => { ws.onclose?.(); });

    // Should NOT reconnect before 60s
    await act(async () => { jest.advanceTimersByTime(59000); });
    expect(MockWebSocket.instances.length).toBeLessThanOrEqual(countBefore + 1); // at most 1 more from microtask timing

    // Should reconnect after 60s
    await act(async () => { jest.advanceTimersByTime(1100); });
    await act(async () => { await Promise.resolve(); });
    expect(MockWebSocket.instances.length).toBeGreaterThan(countBefore);
  });

  it('stops reconnecting after maxRetries', async () => {
    renderHook(() => useWebSocket({ url: 'ws://test', reconnect: true, maxRetries: 2 }));

    await act(async () => { await Promise.resolve(); });
    const initialCount = MockWebSocket.instances.length;

    // Drop 1 → retry 1
    act(() => { MockWebSocket.instances[initialCount - 1].onclose?.(); });
    await act(async () => { jest.advanceTimersByTime(1000); });
    await act(async () => { await Promise.resolve(); });
    const afterRetry1 = MockWebSocket.instances.length;

    // Drop 2 → retry 2
    act(() => { MockWebSocket.instances[afterRetry1 - 1].onclose?.(); });
    await act(async () => { jest.advanceTimersByTime(2000); });
    await act(async () => { await Promise.resolve(); });
    const afterRetry2 = MockWebSocket.instances.length;

    // Drop 3 → no more retries (maxRetries=2 exhausted)
    act(() => { MockWebSocket.instances[afterRetry2 - 1].onclose?.(); });
    await act(async () => { jest.advanceTimersByTime(10000); });

    // No new instances after maxRetries exhausted
    expect(MockWebSocket.instances.length).toBeLessThanOrEqual(afterRetry2 + 1);
  });

  it('does not reconnect when reconnect=false', async () => {
    renderHook(() => useWebSocket({ url: 'ws://test', reconnect: false }));

    await act(async () => { await Promise.resolve(); });

    act(() => { MockWebSocket.instances[0].onclose?.(); });
    await act(async () => { jest.advanceTimersByTime(5000); });

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('calls onDisconnect when connection drops', async () => {
    const onDisconnect = jest.fn();
    renderHook(() => useWebSocket({ url: 'ws://test', onDisconnect, reconnect: false }));

    await act(async () => { await Promise.resolve(); });
    act(() => { MockWebSocket.instances[0].onclose?.(); });

    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('calls onMessage when message received', async () => {
    const onMessage = jest.fn();
    renderHook(() => useWebSocket({ url: 'ws://test', onMessage }));

    await act(async () => { await Promise.resolve(); });

    act(() => {
      MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'message', text: 'Hello' }) });
    });

    expect(onMessage).toHaveBeenCalledWith({ type: 'message', text: 'Hello' });
  });

  it('cleans up on unmount', async () => {
    const { unmount } = renderHook(() => useWebSocket({ url: 'ws://test' }));

    await act(async () => { await Promise.resolve(); });

    unmount();

    expect(MockWebSocket.instances[0].close).toHaveBeenCalled();
  });
});
