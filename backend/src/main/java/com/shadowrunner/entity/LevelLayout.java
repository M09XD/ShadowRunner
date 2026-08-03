package com.shadowrunner.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "level_layouts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("unused")
public class LevelLayout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer levelNumber;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer width;

    @Column(nullable = false)
    private Integer height;

    @Column(columnDefinition = "TEXT")
    private String platforms;

    @Column(columnDefinition = "TEXT")
    private String traps;

    @Column(columnDefinition = "TEXT")
    private String exitPosition;

    @Column(columnDefinition = "TEXT")
    private String spawnPosition;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double difficulty;
}
