package com.shadowrunner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("unused")
public class LevelLayoutDTO {
    private Long id;
    private Integer levelNumber;
    private String name;
    private Integer width;
    private Integer height;
    private String platforms;
    private String traps;
    private String exitPosition;
    private String spawnPosition;
    private String description;
    private Double difficulty;
}
