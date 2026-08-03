package com.shadowrunner.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("unused")
public class LeaderboardEntryDTO {
    private Long id;
    private String playerName;
    private Integer levelNumber;
    private Long completionTimeMs;
    private Integer ranking;
    private Integer skinId;
    private LocalDateTime createdAt;
}
