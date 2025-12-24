'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface GameState {
  // Server time for offset calculation
  serverTime: number;
  roundNumber: number;
  phase: 'betting' | 'warning' | 'locked' | 'spinning' | 'result';
  
  // ABSOLUTE timestamps (clients sync from these)
  roundStartTime: number;
  phaseEndsAt: number;
  spinStartAt: number;  // When spin phase begins
  resultAt: number;     // When result phase begins (wheel must stop here)
  
  // Winning data
  winningIndex: number;
  winningPosition: { number: number | string; color: string };
  targetAngle: number;  // Final wheel rotation angle
  
  // Colors
  outerColors: string[];
  goldPosition: number;
  goldMultiplier: number;
}

export interface ChatMessage {
  username: string;
  displayName: string;
  message: string;
  sentAt: number;
  editedAt?: number;
  replyToTime?: number;
}

type MessageHandler = (type: string, data: unknown) => void;

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const urlRef = useRef(url); // Stable ref to prevent reconnect on URL change
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messageHandlers = useRef<Set<MessageHandler>>(new Set());
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isClosing = useRef(false); // Prevent reconnect during intentional close
  const isMounted = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isClosing.current) return;

    try {
      console.log('Connecting to WebSocket:', urlRef.current);
      const ws = new WebSocket(urlRef.current);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);

          switch (type) {
            case 'gameState':
              setGameState(data as GameState);
              break;

            case 'chatMessage':
              setChatMessages(prev => [data as ChatMessage, ...prev].slice(0, 100));
              break;

            case 'chatEdited':
              setChatMessages(prev => prev.map(msg => 
                msg.sentAt === (data as ChatMessage).sentAt && msg.username === (data as ChatMessage).username
                  ? { ...msg, message: (data as ChatMessage).message, editedAt: (data as ChatMessage).editedAt }
                  : msg
              ));
              break;

            default:
              // Pass to registered handlers
              messageHandlers.current.forEach(handler => handler(type, data));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Only reconnect if not intentionally closing
        if (!isClosing.current) {
          reconnectTimeout.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000); // Increased to 3 seconds
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, []); // Empty deps - uses ref instead

  // Connect on mount only
  useEffect(() => {
    isMounted.current = true;
    urlRef.current = url;
    isClosing.current = false; // Reset on mount
    connect();

    return () => {
      isMounted.current = false;
      isClosing.current = true; // Mark as intentional close
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Only run on mount/unmount

  // Handle visibility change (back button navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current) {
        // Reset closing flag when page becomes visible
        isClosing.current = false;
        
        // Check if we need to reconnect
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log('Page visible - reconnecting WebSocket...');
          connect();
        }
      }
    };

    // Also handle page show event (for back/forward cache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && isMounted.current) {
        isClosing.current = false;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log('Page restored from cache - reconnecting WebSocket...');
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [connect]);

  // Send message helper
  const send = useCallback((type: string, data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  // Authenticate with optional balance data
  const authenticate = useCallback((
    username: string, 
    displayName: string, 
    options?: { balance?: Record<string, number>; currencyType?: 'trial' | 'real' }
  ) => {
    send('auth', { username, displayName, ...options });
  }, [send]);

  // Place bet
  const placeBet = useCallback((bet: { type: string; amount: number; targetNumber?: number; currencyMode?: 'trial' | 'real' }) => {
    send('placeBet', bet);
  }, [send]);

  // Send chat message
  const sendChatMessage = useCallback((message: string, replyToTime?: number) => {
    send('chat', { message, replyToTime });
  }, [send]);

  // Edit chat message
  const editChatMessage = useCallback((sentAt: number, message: string) => {
    send('editChat', { sentAt, message });
  }, [send]);

  // Register custom message handler
  const addMessageHandler = useCallback((handler: MessageHandler) => {
    messageHandlers.current.add(handler);
    return () => messageHandlers.current.delete(handler);
  }, []);

  return {
    isConnected,
    gameState,
    chatMessages,
    authenticate,
    placeBet,
    sendChatMessage,
    editChatMessage,
    addMessageHandler,
  };
}
