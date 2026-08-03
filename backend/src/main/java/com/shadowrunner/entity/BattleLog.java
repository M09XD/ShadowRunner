package com.shadowrunner.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "battle_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("unused")
public class BattleLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String playerName;

    @Column(nullable = false)
    private Integer levelNumber;

    @Column(nullable = false)
    private Integer playerPokemonId;

    @Column(nullable = false)
    private String playerPokemonName;

    @Column(nullable = false)
    private Integer shadowPokemonId;

    @Column(nullable = false)
    private String shadowPokemonName;

    @Column(nullable = false)
    private String battleResult; // WIN or LOSS

    @Column(columnDefinition = "TEXT")
    private String battleLog;

    @Column(nullable = false)
    private Long battleDurationMs;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
