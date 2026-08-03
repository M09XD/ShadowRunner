package com.shadowrunner.repository;

import com.shadowrunner.entity.BattleLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
@SuppressWarnings("unused")
public interface BattleLogRepository extends JpaRepository<BattleLog, Long> {
    List<BattleLog> findByPlayerName(String playerName);
    List<BattleLog> findByPlayerNameAndLevelNumber(String playerName, Integer levelNumber);
    List<BattleLog> findByBattleResult(String battleResult);
}
