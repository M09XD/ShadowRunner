package com.shadowrunner.repository;

import com.shadowrunner.entity.AITrainingData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
@SuppressWarnings("unused")
public interface AITrainingRepository extends JpaRepository<AITrainingData, Long> {
    List<AITrainingData> findByPlayerName(String playerName);
    List<AITrainingData> findByPlayerNameAndPokemonId(String playerName, Integer pokemonId);
    List<AITrainingData> findByPokemonId(Integer pokemonId);
}
