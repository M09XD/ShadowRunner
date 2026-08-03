package com.shadowrunner.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_training")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("unused")
public class AITrainingData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String playerName;

    @Column(nullable = false)
    private Integer pokemonId;

    @Column(nullable = false)
    private String pokemonName;

    @Column(nullable = false)
    private String moveUsed;

    @Column(nullable = false)
    private Integer moveCount;

    @Column(nullable = false)
    private Double successRate;

    @Column(columnDefinition = "TEXT")
    private String moveHistory;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
