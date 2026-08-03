package com.shadowrunner.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class GameWebSocketHandler extends TextWebSocketHandler {
    
    private final ObjectMapper objectMapper;
    private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private static final Map<String, String> playerRooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established: {}", session.getId());
        sessions.put(session.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            Map<String, Object> data = objectMapper.readValue(message.getPayload(), Map.class);
            String messageType = (String) data.get("type");
            String playerName = (String) data.get("playerName");
            
            log.debug("WebSocket message type: {} from player: {}", messageType, playerName);

            switch (messageType) {
                case "join":
                    handleJoin(session, playerName, data);
                    break;
                case "move":
                    handleMove(playerName, data);
                    break;
                case "battle_start":
                    handleBattleStart(playerName, data);
                    break;
                case "battle_move":
                    handleBattleMove(playerName, data);
                    break;
                case "leave":
                    handleLeave(session, playerName);
                    break;
                default:
                    log.warn("Unknown message type: {}", messageType);
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message: {}", e.getMessage(), e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("WebSocket connection closed: {}", session.getId());
        
        // CRITICAL FIX #2: Properly cleanup session from all maps
        sessions.remove(session.getId());
        
        // Find and remove from playerRooms
        String playerName = playerRooms.entrySet().stream()
            .filter(e -> e.getValue().equals(session.getId()))
            .map(Map.Entry::getKey)
            .findFirst()
            .orElse(null);
        
        if (playerName != null) {
            playerRooms.remove(playerName);
            try {
                handleLeave(session, playerName);
            } catch (Exception e) {
                log.warn("Error cleaning up player {} on disconnect: {}", playerName, e.getMessage());
            }
        }
    }

    private void handleJoin(WebSocketSession session, String playerName, Map<String, Object> data) throws IOException {
        log.info("Player {} joined game", playerName);
        playerRooms.put(playerName, session.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "join_success");
        response.put("playerName", playerName);
        response.put("message", "Joined game successfully");
        
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
    }

    private void handleMove(String playerName, Map<String, Object> data) throws IOException {
        log.debug("Player {} moved: {}", playerName, data);
        
        String sessionId = playerRooms.get(playerName);
        if (sessionId != null) {
            WebSocketSession session = sessions.get(sessionId);
            if (session != null && session.isOpen()) {
                Map<String, Object> broadcast = new HashMap<>();
                broadcast.put("type", "player_move");
                broadcast.put("playerName", playerName);
                broadcast.put("x", data.get("x"));
                broadcast.put("y", data.get("y"));
                
                // Broadcast to all connected clients
                for (WebSocketSession s : sessions.values()) {
                    if (s.isOpen() && !s.getId().equals(sessionId)) {
                        s.sendMessage(new TextMessage(objectMapper.writeValueAsString(broadcast)));
                    }
                }
            }
        }
    }

    private void handleBattleStart(String playerName, Map<String, Object> data) throws IOException {
        log.info("Battle started for player: {}", playerName);
        
        Map<String, Object> broadcast = new HashMap<>();
        broadcast.put("type", "battle_started");
        broadcast.put("playerName", playerName);
        broadcast.put("shadowPokemon", data.get("shadowPokemon"));
        
        broadcastToAll(broadcast);
    }

    private void handleBattleMove(String playerName, Map<String, Object> data) throws IOException {
        log.debug("Battle move from player: {}", playerName);
        
        Map<String, Object> broadcast = new HashMap<>();
        broadcast.put("type", "battle_move");
        broadcast.put("playerName", playerName);
        broadcast.put("move", data.get("move"));
        broadcast.put("damage", data.get("damage"));
        
        broadcastToAll(broadcast);
    }

    private void handleLeave(WebSocketSession session, String playerName) throws IOException {
        log.info("Player {} left game", playerName);
        playerRooms.remove(playerName);
        
        Map<String, Object> broadcast = new HashMap<>();
        broadcast.put("type", "player_left");
        broadcast.put("playerName", playerName);
        
        broadcastToAll(broadcast);
    }

    private void broadcastToAll(Map<String, Object> message) {
        // CRITICAL FIX #4: Handle IOException per session instead of crashing entire broadcast
        String payload;
        try {
            payload = objectMapper.writeValueAsString(message);
        } catch (IOException e) {
            log.error("Failed to serialize message: {}", e.getMessage());
            return;
        }
        
        List<String> failedSessions = new ArrayList<>();
        
        for (Map.Entry<String, WebSocketSession> entry : sessions.entrySet()) {
            String sessionId = entry.getKey();
            WebSocketSession session = entry.getValue();
            
            if (session != null && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(payload));
                } catch (IOException e) {
                    log.warn("Failed to send message to session {}: {}", sessionId, e.getMessage());
                    failedSessions.add(sessionId);
                }
            }
        }
        
        // Clean up failed sessions
        failedSessions.forEach(sessionId -> {
            sessions.remove(sessionId);
            log.debug("Removed failed session: {}", sessionId);
        });
    }
}
