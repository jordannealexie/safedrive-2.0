import { useEffect, useRef, useState, useCallback } from 'react';
import { getWsUrl, type LiveSensorData } from '@/lib/api';

export function useLiveSensor() {
    const [data, setData] = useState<LiveSensorData | null>(null);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(getWsUrl('/ws/live'));
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);

        ws.onmessage = (event) => {
            try {
                const parsed: LiveSensorData = JSON.parse(event.data);
                setData(parsed);
            } catch {
                // ignore malformed messages
            }
        };

        ws.onclose = () => {
            setConnected(false);
            // Reconnect after 3 seconds
            reconnectTimerRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
        };
    }, [connect]);

    return { data, connected };
}
