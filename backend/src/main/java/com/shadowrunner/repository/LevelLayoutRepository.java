package com.shadowrunner.repository;

import com.shadowrunner.entity.LevelLayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
@SuppressWarnings("unused")
public interface LevelLayoutRepository extends JpaRepository<LevelLayout, Long> {
    Optional<LevelLayout> findByLevelNumber(Integer levelNumber);
    List<LevelLayout> findAllByOrderByLevelNumberAsc();
}
