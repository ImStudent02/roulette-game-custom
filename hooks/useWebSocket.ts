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
    urlRef.current = url;
    connect();

    return () => {
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

  // Send message helper
  const send = useCallback((type: string, data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  // Authenticate
  const authenticate = useCallback((username: string, displayName: string) => {
    send('auth', { username, displayName });
  }, [send]);

  // Place bet
  const placeBet = useCallback((bet: { type: string; amount: number; targetNumber?: number }) => {
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
