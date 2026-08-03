package com.shadowrunner.repository;

import com.shadowrunner.entity.LeaderboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
@SuppressWarnings("unused")
public interface LeaderboardRepository extends JpaRepository<LeaderboardEntry, Long> {
    List<LeaderboardEntry> findByLevelNumberOrderByCompletionTimeMs(Integer levelNumber);
    List<LeaderboardEntry> findByPlayerNameOrderByCreatedAtDesc(String playerName);
    
    @Query("SELECT l FROM LeaderboardEntry l ORDER BY l.completionTimeMs ASC LIMIT 100")
    List<LeaderboardEntry> findTopGlobal();
    
    @Query("SELECT l FROM LeaderboardEntry l WHERE l.levelNumber = ?1 ORDER BY l.ranking DESC LIMIT 10")
    List<LeaderboardEntry> findTop10ByLevel(Integer levelNumber);
}
