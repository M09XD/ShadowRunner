import React, { useState, useEffect, useCallback } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { usePokemonBattle } from '@/hooks/usePokemonBattle';
import { GameCanvas } from '@/components/game/GameCanvas';
import { MainMenu } from '@/components/game/MainMenu';
import { PokemonSelect } from '@/components/game/PokemonSelect';
import { BattleScreen } from '@/components/game/BattleScreen';
import { Leaderboard } from '@/components/game/Leaderboard';
import { PlayerProfile } from '@/components/game/PlayerProfile';
import { SkinSelect } from '@/components/game/SkinSelect';
import { VictoryScreen } from '@/components/game/VictoryScreen';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import { GameHUD } from '@/components/game/GameHUD';
import { PauseMenu } from '@/components/game/PauseMenu';
import { LoadingScreen } from '@/components/game/LoadingScreen';

// Add Press Start 2P font
if (typeof document !== 'undefined') {
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
  fontLink.rel = 'stylesheet';
  if (!document.querySelector('link[href*="Press+Start+2P"]')) {
    document.head.appendChild(fontLink);
  }
}

export default function AppLayout() {
  const {
    gameState,
    currentLevelData,
    levels,
    startGame,
    resetLevel,
    setPlayerSkin,
    goToMenu,
    startBattle,
    endBattle,
    nextLevel,
    showLeaderboard,
    showSkinSelect,
    showProfile,
  } = useGameEngine();

  const {
    battleState,
    allPokemon,
    loadingPokemon,
    selectedPokemon,
    selectionTimer,
    isSelecting,
    fetchAllPokemon,
    fetchPokemonDetails,
    startSelection,
    selectPokemon,
    initializeBattle,
    executePlayerMove,
    resetBattle,
  } = usePokemonBattle();

  const [isPaused, setIsPaused] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  // Handle game status changes
  useEffect(() => {
    if (gameState.gameStatus === 'pokemon_select') {
      startSelection();
    } else if (gameState.gameStatus === 'victory') {
      setShowVictory(true);
    } else if (gameState.gameStatus === 'game_over') {
      setShowGameOver(true);
    }
  }, [gameState.gameStatus, startSelection]);

  // Handle Pokemon selection complete
  useEffect(() => {
    if (selectedPokemon && gameState.gameStatus === 'pokemon_select') {
      const isBossLevel = gameState.currentLevel === 16;
      const playerName = localStorage.getItem('playerName') || 'player';
      // Store boss level flag for battle system
      localStorage.setItem('isBossLevel', isBossLevel.toString());
      initializeBattle(selectedPokemon, isBossLevel, playerName);
      startBattle();
    }
  }, [selectedPokemon, gameState.gameStatus, gameState.currentLevel, initializeBattle, startBattle]);

  // Handle battle end
  const handleBattleEnd = useCallback((playerWon: boolean) => {
    resetBattle();
    endBattle(playerWon);
  }, [resetBattle, endBattle]);

  // Handle victory screen actions
  const handleNextLevel = useCallback(() => {
    setShowVictory(false);
    nextLevel();
  }, [nextLevel]);

  const handleShowLeaderboardFromVictory = useCallback(() => {
    setShowVictory(false);
    showLeaderboard();
  }, [showLeaderboard]);

  // Handle game over actions
  const handleRetry = useCallback(() => {
    setShowGameOver(false);
    resetLevel(false);
  }, [resetLevel]);

  // Handle pause
  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleRestartFromPause = useCallback(() => {
    setIsPaused(false);
    resetLevel(false);
  }, [resetLevel]);

  const handleBackToMenuFromPause = useCallback(() => {
    setIsPaused(false);
    goToMenu();
  }, [goToMenu]);

  const handleBackToMenuFromVictory = useCallback(() => {
    setShowVictory(false);
    goToMenu();
  }, [goToMenu]);

  const handleBackToMenuFromGameOver = useCallback(() => {
    setShowGameOver(false);
    goToMenu();
  }, [goToMenu]);

  // Keyboard shortcut for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState.gameStatus === 'playing') {
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameStatus]);

  // Render based on game status
  const renderGameContent = () => {
    switch (gameState.gameStatus) {
      case 'menu':
        return (
          <MainMenu
            onStartGame={startGame}
            onShowLeaderboard={showLeaderboard}
            onShowSkinSelect={showSkinSelect}
            onShowProfile={showProfile}
            currentSkin={gameState.player.skinId}
          />
        );

      case 'skin_select':
        return (
          <SkinSelect
            currentSkin={gameState.player.skinId}
            onSelectSkin={setPlayerSkin}
            onBack={goToMenu}
          />
        );

      case 'leaderboard':
        return (
          <Leaderboard
            onBack={goToMenu}
            currentLevel={gameState.currentLevel}
            completionTime={gameState.timer}
          />
        );

      case 'profile':
        return (
          <PlayerProfile
            onBack={goToMenu}
            onLogout={() => {
              // Clear all authentication data
              localStorage.removeItem('authToken');
              localStorage.removeItem('playerName');
              localStorage.removeItem('accountId');
              localStorage.removeItem('email');
              localStorage.removeItem('playerStats');
              localStorage.removeItem('guestName');
              goToMenu();
            }}
          />
        );

      case 'pokemon_select':
        return (
          <PokemonSelect
            allPokemon={allPokemon}
            loadingPokemon={loadingPokemon}
            selectionTimer={selectionTimer}
            onSelect={selectPokemon}
            fetchPokemonDetails={fetchPokemonDetails}
            fetchAllPokemon={fetchAllPokemon}
          />
        );

      case 'battle':
        return (
          <BattleScreen
            battleState={battleState}
            onMoveSelect={executePlayerMove}
            onBattleEnd={handleBattleEnd}
          />
        );

      case 'playing':
      case 'victory':
      case 'game_over':
        // Show loading if levels haven't loaded yet
        if (!currentLevelData && levels.length === 0) {
          return <LoadingScreen message="Loading levels..." />;
        }
        
        return (
          <div className="min-h-screen bg-gradient-to-b from-purple-950 via-black to-purple-950 flex items-center justify-center">
            <div className="relative">
              <GameCanvas
                gameState={gameState}
                levelData={currentLevelData}
              />
              <GameHUD
                gameState={gameState}
                levelData={currentLevelData}
                onPause={handlePause}
              />
            </div>

            {/* Pause Menu Overlay */}
            {isPaused && (
              <PauseMenu
                onResume={handleResume}
                onRestart={handleRestartFromPause}
                onBackToMenu={handleBackToMenuFromPause}
              />
            )}

            {/* Victory Screen Overlay */}
            {showVictory && (
              <VictoryScreen
                levelNumber={gameState.currentLevel}
                completionTime={gameState.timer}
                onNextLevel={handleNextLevel}
                onShowLeaderboard={handleShowLeaderboardFromVictory}
                onBackToMenu={handleBackToMenuFromVictory}
                isLastLevel={gameState.currentLevel >= 16}
              />
            )}

            {/* Game Over Screen Overlay */}
            {showGameOver && (
              <GameOverScreen
                onRetry={handleRetry}
                onBackToMenu={handleBackToMenuFromGameOver}
              />
            )}
          </div>
        );


      default:
        return (
          <MainMenu
            onStartGame={startGame}
            onShowLeaderboard={showLeaderboard}
            onShowSkinSelect={showSkinSelect}
            currentSkin={gameState.player.skinId}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {renderGameContent()}
    </div>
  );
}
