package com.shadowrunner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("unused")
public class BattleResultDTO {
    private String playerName;
    private Integer levelNumber;
    private Integer playerPokemonId;
    private String playerPokemonName;
    private Integer shadowPokemonId;
    private String shadowPokemonName;
    private String result; // WIN or LOSS
    private String battleLog;
    private Long battleDurationMs;
}
