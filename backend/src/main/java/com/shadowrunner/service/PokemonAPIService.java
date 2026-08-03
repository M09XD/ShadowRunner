package com.shadowrunner.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class PokemonAPIService {
    
    private final WebClient.Builder webClientBuilder;

    @Value("${app.pokemon-api-base-url}")
    private String pokemonApiBaseUrl;

    @Value("${app.pokemon-api-timeout}")
    private long apiTimeout;

    public Mono<Map<String, Object>> getPokemonByIdAsync(Integer pokemonId) {
        log.info("Fetching Pokemon with ID: {}", pokemonId);
        
        return webClientBuilder.baseUrl(pokemonApiBaseUrl)
            .build()
            .get()
            .uri("/pokemon/{id}", pokemonId)
            .retrieve()
            .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
            .doOnError(error -> log.error("Error fetching Pokemon {}: {}", pokemonId, error.getMessage()))
            .timeout(java.time.Duration.ofMillis(apiTimeout));
    }

    public Mono<Map<String, Object>> getPokemonByNameAsync(String pokemonName) {
        log.info("Fetching Pokemon with name: {}", pokemonName);
        
        return webClientBuilder.baseUrl(pokemonApiBaseUrl)
            .build()
            .get()
            .uri("/pokemon/{name}", pokemonName.toLowerCase())
            .retrieve()
            .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
            .doOnError(error -> log.error("Error fetching Pokemon {}: {}", pokemonName, error.getMessage()))
            .timeout(java.time.Duration.ofMillis(apiTimeout));
    }

    public Mono<Map<String, Object>> getPokemonListAsync(Integer offset, Integer limit) {
        log.info("Fetching Pokemon list offset: {} limit: {}", offset, limit);
        
        return webClientBuilder.baseUrl(pokemonApiBaseUrl)
            .build()
            .get()
            .uri("/pokemon?offset={offset}&limit={limit}", offset, limit)
            .retrieve()
            .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
            .doOnError(error -> log.error("Error fetching Pokemon list: {}", error.getMessage()))
            .timeout(java.time.Duration.ofMillis(apiTimeout));
    }

    public Mono<Map<String, Object>> getTypeAsync(String typeName) {
        log.info("Fetching type: {}", typeName);
        
        return webClientBuilder.baseUrl(pokemonApiBaseUrl)
            .build()
            .get()
            .uri("/type/{name}", typeName.toLowerCase())
            .retrieve()
            .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
            .doOnError(error -> log.error("Error fetching type {}: {}", typeName, error.getMessage()))
            .timeout(java.time.Duration.ofMillis(apiTimeout));
    }

    public Mono<Map<String, Object>> getMoveAsync(String moveName) {
        log.info("Fetching move: {}", moveName);
        
        return webClientBuilder.baseUrl(pokemonApiBaseUrl)
            .build()
            .get()
            .uri("/move/{name}", moveName.toLowerCase())
            .retrieve()
            .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
            .doOnError(error -> log.error("Error fetching move {}: {}", moveName, error.getMessage()))
            .timeout(java.time.Duration.ofMillis(apiTimeout));
    }
}
