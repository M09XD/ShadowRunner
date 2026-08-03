package com.shadowrunner.service;

import com.shadowrunner.dto.LevelLayoutDTO;
import com.shadowrunner.entity.LevelLayout;
import com.shadowrunner.repository.LevelLayoutRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LevelService {

    private final LevelLayoutRepository levelLayoutRepository;

    public LevelLayoutDTO getLevelByNumber(Integer levelNumber) {
        Optional<LevelLayout> levelOpt = levelLayoutRepository.findByLevelNumber(levelNumber);
        if (levelOpt.isEmpty()) {
            throw new RuntimeException("Level not found: " + levelNumber);
        }
        return convertToDTO(levelOpt.get());
    }

    public List<LevelLayoutDTO> getAllLevels() {
        return levelLayoutRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LevelLayoutDTO createLevel(LevelLayoutDTO dto) {
        LevelLayout level = LevelLayout.builder()
                .levelNumber(dto.getLevelNumber())
                .name(dto.getName())
                .width(dto.getWidth())
                .height(dto.getHeight())
                .platforms(dto.getPlatforms())
                .traps(dto.getTraps())
                .exitPosition(dto.getExitPosition())
                .spawnPosition(dto.getSpawnPosition())
                .description(dto.getDescription())
                .difficulty(dto.getDifficulty())
                .build();

        LevelLayout saved = levelLayoutRepository.save(level);
        return convertToDTO(saved);
    }

    @Transactional
    public LevelLayoutDTO updateLevel(Integer levelNumber, LevelLayoutDTO dto) {
        Optional<LevelLayout> levelOpt = levelLayoutRepository.findByLevelNumber(levelNumber);
        if (levelOpt.isEmpty()) {
            throw new RuntimeException("Level not found: " + levelNumber);
        }

        LevelLayout level = levelOpt.get();
        level.setName(dto.getName());
        level.setWidth(dto.getWidth());
        level.setHeight(dto.getHeight());
        level.setPlatforms(dto.getPlatforms());
        level.setTraps(dto.getTraps());
        level.setExitPosition(dto.getExitPosition());
        level.setSpawnPosition(dto.getSpawnPosition());
        level.setDescription(dto.getDescription());
        level.setDifficulty(dto.getDifficulty());

        LevelLayout saved = levelLayoutRepository.save(level);
        return convertToDTO(saved);
    }

    private LevelLayoutDTO convertToDTO(LevelLayout level) {
        return LevelLayoutDTO.builder()
                .levelNumber(level.getLevelNumber())
                .name(level.getName())
                .width(level.getWidth())
                .height(level.getHeight())
                .platforms(level.getPlatforms())
                .traps(level.getTraps())
                .exitPosition(level.getExitPosition())
                .spawnPosition(level.getSpawnPosition())
                .description(level.getDescription())
                .difficulty(level.getDifficulty())
                .build();
    }
}
