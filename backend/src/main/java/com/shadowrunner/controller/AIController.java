package com.shadowrunner.controller;

import com.shadowrunner.dto.AITrainingDTO;
import com.shadowrunner.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class AIController {
    
    private final AIService aiService;

    @PostMapping("/record-move")
    public ResponseEntity<Void> recordMove(@RequestBody Map<String, Object> request) {
        log.info("POST /ai/record-move");
        try {
            String playerName = (String) request.get("playerName");
            Integer pokemonId = (Integer) request.get("pokemonId");
            String pokemonName = (String) request.get("pokemonName");
            String moveUsed = (String) request.get("moveUsed");
            
            aiService.recordMove(playerName, pokemonId, pokemonName, moveUsed);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error recording move: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/predict/{playerName}/{pokemonId}")
    public ResponseEntity<String> predictNextMove(
            @PathVariable String playerName,
            @PathVariable Integer pokemonId) {
        log.info("GET /ai/predict/{}/{}", playerName, pokemonId);
        try {
            String nextMove = aiService.predictNextMove(playerName, pokemonId);
            return ResponseEntity.ok(nextMove);
        } catch (Exception e) {
            log.error("Error predicting move: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/counter/{playerName}/{playerPokemonId}/{shadowPokemonId}")
    public ResponseEntity<String> getCounterMove(
            @PathVariable String playerName,
            @PathVariable Integer playerPokemonId,
            @PathVariable Integer shadowPokemonId) {
        log.info("GET /ai/counter/{}/{}/{}", playerName, playerPokemonId, shadowPokemonId);
        try {
            String counterMove = aiService.getCounterMove(playerName, playerPokemonId, shadowPokemonId);
            return ResponseEntity.ok(counterMove);
        } catch (Exception e) {
            log.error("Error getting counter move: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/training-data/{playerName}")
    public ResponseEntity<List<AITrainingDTO>> getTrainingData(@PathVariable String playerName) {
        log.info("GET /ai/training-data/{}", playerName);
        try {
            List<AITrainingDTO> data = aiService.getPlayerTrainingData(playerName);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("Error fetching training data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
