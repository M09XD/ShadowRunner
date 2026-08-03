package com.shadowrunner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("unused")
public class AITrainingDTO {
    private Long id;
    private String playerName;
    private Integer pokemonId;
    private String pokemonName;
    private String moveUsed;
    private Integer moveCount;
    private Double successRate;
    private String moveHistory;
}
