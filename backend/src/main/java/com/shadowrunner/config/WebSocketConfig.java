package com.shadowrunner.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import com.shadowrunner.websocket.GameWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {
    
    @Autowired
    private final GameWebSocketHandler gameWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // CRITICAL FIX #8: Allow all frontend ports
        registry.addHandler(gameWebSocketHandler, "/ws/game")
                .setAllowedOrigins("http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000");
    }
}
