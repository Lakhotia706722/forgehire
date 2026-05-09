'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnect?: boolean;
  maxRetries?: number;
}

/**
 * WebSocket hook with exponential backoff reconnection.
 * Reconnects automatically if connection drops mid-conversation.
 */
export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  reconnect = true,
  maxRetries = 8,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      setStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        retriesRef.current = 0;
        setStatus('connected');
        onConnect?.();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          onMessage?.(event.data);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus('disconnected');
        onDisconnect?.();

        if (reconnect && retriesRef.current < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s
          const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 60000);
          retriesRef.current += 1;
          retryTimerRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setStatus('error');
        ws.close();
      };
    } catch {
      setStatus('error');
    }
  }, [url, onMessage, onConnect, onDisconnect, reconnect, maxRetries]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimeout(retryTimerRef.current);
    wsRef.current?.close();
  }, []);

  return { status, send, disconnect, retryCount: retriesRef.current };
}
