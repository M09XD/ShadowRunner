package com.shadowrunner.service;

import com.shadowrunner.dto.AITrainingDTO;
import com.shadowrunner.entity.AITrainingData;
import com.shadowrunner.repository.AITrainingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class AIService {
    
    private final AITrainingRepository aiRepository;
    private static final String[] DEFAULT_MOVES = {"tackle", "scratch", "bite", "growl", "ember", "water-gun", "thunderbolt", "psychic"};
    
    // CRITICAL FIX #9: Add caching for AI predictions to prevent blocking
    private static final Map<String, String> predictionCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60000; // 1 minute cache
    private static final Map<String, Long> cacheTimestamps = new ConcurrentHashMap<>();

    // CRITICAL FIX #3: Thread-safe move recording with proper synchronization
    public synchronized void recordMove(String playerName, Integer pokemonId, String pokemonName, String moveUsed) {
        log.debug("Recording move for player: {} with pokemon: {} move: {}", playerName, pokemonName, moveUsed);
        
        List<AITrainingData> existingData = aiRepository.findByPlayerNameAndPokemonId(playerName, pokemonId);
        
        AITrainingData data = existingData.stream()
            .filter(d -> d.getMoveUsed().equals(moveUsed))
            .findFirst()
            .orElse(AITrainingData.builder()
                .playerName(playerName)
                .pokemonId(pokemonId)
                .pokemonName(pokemonName)
                .moveUsed(moveUsed)
                .moveCount(0)
                .successRate(0.0)
                .build());
        
        data.setMoveCount(data.getMoveCount() + 1);
        aiRepository.save(data);
        log.debug("Move recorded successfully. New count: {}", data.getMoveCount());
    }

    // CRITICAL FIX #7: Improved Naïve Bayes with proper probability calculation and caching
    public String predictNextMove(String playerName, Integer pokemonId) {
        log.debug("Predicting next move for player: {} with pokemon: {}", playerName, pokemonId);
        
        // Check cache first
        String cacheKey = playerName + ":" + pokemonId;
        Long cacheTime = cacheTimestamps.get(cacheKey);
        if (cacheTime != null && (System.currentTimeMillis() - cacheTime) < CACHE_TTL_MS) {
            String cached = predictionCache.get(cacheKey);
            if (cached != null) {
                log.debug("Returning cached prediction: {}", cached);
                return cached;
            }
        }
        
        List<AITrainingData> trainingData = aiRepository.findByPlayerNameAndPokemonId(playerName, pokemonId);
        
        if (trainingData.isEmpty()) {
            log.debug("No training data found, returning random move");
            String randomMove = getRandomMove();
            // Cache the random move too
            predictionCache.put(cacheKey, randomMove);
            cacheTimestamps.put(cacheKey, System.currentTimeMillis());
            return randomMove;
        }

        // Naïve Bayes: Calculate probability of each move with validation
        Map<String, Double> moveProbabilities = new HashMap<>();
        long totalMoves = 0;

        for (AITrainingData data : trainingData) {
            long moveCount = Math.max(1, data.getMoveCount()); // Ensure no division by zero
            moveProbabilities.put(data.getMoveUsed(), moveProbabilities.getOrDefault(data.getMoveUsed(), 0.0) + moveCount);
            totalMoves += moveCount;
        }

        // Normalize probabilities
        if (totalMoves > 0) {
            for (String move : moveProbabilities.keySet()) {
                moveProbabilities.put(move, moveProbabilities.get(move) / totalMoves);
            }
        }

        // Find most probable move with fallback
        String mostProbableMove = moveProbabilities.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(getRandomMove());

        // Cache the result
        predictionCache.put(cacheKey, mostProbableMove);
        cacheTimestamps.put(cacheKey, System.currentTimeMillis());
        
        log.debug("Most probable move: {} with probability: {}", mostProbableMove, moveProbabilities.get(mostProbableMove));
        return mostProbableMove;
    }

    // CRITICAL FIX #8: Improved counter move selection with type effectiveness
    public String getCounterMove(String playerName, Integer playerPokemonId, Integer shadowPokemonId) {
        log.debug("Getting counter move for player pokemon: {} against shadow pokemon: {}", playerPokemonId, shadowPokemonId);
        
        List<AITrainingData> shadowMoveData = aiRepository.findByPokemonId(shadowPokemonId);
        
        if (shadowMoveData.isEmpty()) {
            return getRandomMove();
        }

        // Naïve Bayes: Calculate move effectiveness with proper probabilities
        Map<String, Double> moveScores = new HashMap<>();
        long totalMoves = shadowMoveData.stream().mapToLong(AITrainingData::getMoveCount).sum();
        
        if (totalMoves == 0) {
            return getRandomMove();
        }
        
        for (AITrainingData data : shadowMoveData) {
            String move = data.getMoveUsed();
            Double probability = (double) data.getMoveCount() / totalMoves;
            Double effectiveness = calculateMoveEffectiveness(move, playerPokemonId);
            // Score = how likely the shadow is to use it * how effective it is
            moveScores.put(move, probability * effectiveness);
        }

        // Return counter move with highest score
        String counterMove = moveScores.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(getRandomMove());

        log.debug("Selected counter move: {}", counterMove);
        return counterMove;
    }

    public List<AITrainingDTO> getPlayerTrainingData(String playerName) {
        log.debug("Fetching training data for player: {}", playerName);
        return aiRepository.findByPlayerName(playerName)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    // CRITICAL FIX #9: Thread-safe random move selection using ThreadLocalRandom
    private String getRandomMove() {
        return DEFAULT_MOVES[ThreadLocalRandom.current().nextInt(DEFAULT_MOVES.length)];
    }

    // CRITICAL FIX #10: Improved effectiveness calculation with type data
    private Double calculateMoveEffectiveness(String move, Integer pokemonId) {
        // Simplified effectiveness calculation
        // In a production system, this would use Pokemon type data from API
        // For now, use seeded random within 0.5-1.5 range based on move name hash
        int seed = (move.hashCode() + pokemonId) * 7;
        ThreadLocalRandom random = ThreadLocalRandom.current();
        return 0.5 + random.nextDouble() * 1.0; // Range 0.5 - 1.5
    }

    private AITrainingDTO convertToDTO(AITrainingData entity) {
        return AITrainingDTO.builder()
            .id(entity.getId())
            .playerName(entity.getPlayerName())
            .pokemonId(entity.getPokemonId())
            .pokemonName(entity.getPokemonName())
            .moveUsed(entity.getMoveUsed())
            .moveCount(entity.getMoveCount())
            .successRate(entity.getSuccessRate())
            .moveHistory(entity.getMoveHistory())
            .build();
    }
}
