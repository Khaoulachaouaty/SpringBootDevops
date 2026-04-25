package com.itbs.clinique.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker  // Active le support WebSocket
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 📤 Où envoyer les messages (préfixe pour les notifications sortantes)
        config.enableSimpleBroker("/topic", "/queue");
        
        // 📥 Où les clients envoient leurs messages (préfixe pour les messages entrants)
        config.setApplicationDestinationPrefixes("/app");
        
        // 👤 Permet d'envoyer des messages à un utilisateur spécifique
        config.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 🔌 Point de connexion WebSocket (le frontend Angular se connectera ici)
        registry.addEndpoint("/ws-notifications")
                .setAllowedOriginPatterns("*")  // Permet Angular (port 4200)
                .withSockJS();  // Fallback pour les navigateurs qui ne supportent pas WebSocket
    }
}