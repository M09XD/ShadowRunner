// WebSocket Manager for Multiplayer Support

export interface WebSocketMessage {
  type: string;
  playerName?: string;
  x?: number;
  y?: number;
  move?: string;
  damage?: number;
  [key: string]: unknown;
}

class WebSocketManager {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnecting = false;

  connect(playerName: string, onConnect?: () => void, onError?: (error: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject('Connection already in progress');
        return;
      }

      this.isConnecting = true;
      
      // Prefer configured WS URL; fallback to localhost:8081
      const env = (import.meta as unknown as { env?: Record<string, string> }).env;
      const wsUrl =
        env?.VITE_WS_URL ||
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8081/api/ws/game`;
      
      console.log('[WebSocket] Connecting to:', wsUrl);

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          
          // Send join message
          this.send({
            type: 'join',
            playerName: playerName,
          });

          onConnect?.();
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        this.socket.onerror = (event) => {
          console.error('[WebSocket] Error:', event);
          this.isConnecting = false;
          const error = 'WebSocket connection error';
          onError?.(error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('[WebSocket] Closed');
          this.isConnecting = false;
          this.attemptReconnect(playerName, onConnect, onError);
        };
      } catch (error) {
        this.isConnecting = false;
        const errorMsg = `Failed to create WebSocket: ${error}`;
        onError?.(errorMsg);
        reject(errorMsg);
      }
    });
  }

  private attemptReconnect(playerName: string, onConnect?: () => void, onError?: (error: string) => void) {
    // CRITICAL FIX #16: Implement proper exponential backoff and reset flag
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Exponential backoff: 3s, 6s, 12s, 24s, 48s
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[WebSocket] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}, delay: ${delay}ms)`);
      
      setTimeout(() => {
        this.connect(playerName, onConnect, onError).catch(error => {
          console.error('[WebSocket] Reconnection failed:', error);
          // Don't call attemptReconnect here - let the disconnect handler manage retry
        });
      }, delay);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.isConnecting = false; // FIX: Reset flag on failure
      onError?.('Max reconnection attempts reached');
    }
  }

  send(message: WebSocketMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Socket not ready');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      return false;
    }
  }

  on(messageType: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, new Set());
    }
    this.listeners.get(messageType)!.add(callback);
  }

  off(messageType: string, callback: (data: unknown) => void): void {
    // CRITICAL FIX #8: Properly clean up listeners to prevent memory leaks
    if (this.listeners.has(messageType)) {
      this.listeners.get(messageType)!.delete(callback);
      // Clean up empty listener sets
      if (this.listeners.get(messageType)!.size === 0) {
        this.listeners.delete(messageType);
      }
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();
