package com.shadowrunner.controller;

import com.shadowrunner.dto.LevelLayoutDTO;
import com.shadowrunner.service.LevelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/levels")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class LevelController {
    
    private final LevelService levelService;

    @GetMapping("/{levelNumber}")
    public ResponseEntity<LevelLayoutDTO> getLevel(@PathVariable Integer levelNumber) {
        log.info("GET /levels/{}", levelNumber);
        try {
            LevelLayoutDTO level = levelService.getLevelByNumber(levelNumber);
            return ResponseEntity.ok(level);
        } catch (Exception e) {
            log.error("Error fetching level: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<LevelLayoutDTO>> getAllLevels() {
        log.info("GET /levels");
        try {
            List<LevelLayoutDTO> levels = levelService.getAllLevels();
            return ResponseEntity.ok(levels);
        } catch (Exception e) {
            log.error("Error fetching all levels: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<LevelLayoutDTO> createLevel(@RequestBody LevelLayoutDTO dto) {
        log.info("POST /levels with level: {}", dto.getLevelNumber());
        try {
            LevelLayoutDTO created = levelService.createLevel(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating level: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{levelNumber}")
    public ResponseEntity<LevelLayoutDTO> updateLevel(
            @PathVariable Integer levelNumber,
            @RequestBody LevelLayoutDTO dto) {
        log.info("PUT /levels/{}", levelNumber);
        try {
            LevelLayoutDTO updated = levelService.updateLevel(levelNumber, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating level: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
