import { useCallback, useEffect, useState } from 'react';
import { levelAPI, playerAPI, battleAPI, aiAPI } from '@/lib/api';
import { wsManager } from '@/lib/websocket';
import { pokemonService, PokemonData, MoveData } from '@/lib/pokemon';

type PlayerMoveMessage = { type: 'player_move'; playerName: string; x: number; y: number };
type PlayerLeftMessage = { type: 'player_left'; playerName: string };

export interface BattleState {
  playerPokemon: PokemonData | null;
  shadowPokemon: PokemonData | null;
  playerHP: number;
  playerMaxHP: number;
  shadowHP: number;
  shadowMaxHP: number;
  playerMoves: MoveData[];
  shadowMoves: MoveData[];
  currentTurn: 'player' | 'shadow';
  battleLog: string[];
  isAnimating: boolean;
  battleEnded: boolean;
  winner: 'player' | 'shadow' | null;
}

export function useBattleSystem(playerName: string) {
  const [battleState, setBattleState] = useState<BattleState>({
    playerPokemon: null,
    shadowPokemon: null,
    playerHP: 100,
    playerMaxHP: 100,
    shadowHP: 100,
    shadowMaxHP: 100,
    playerMoves: [],
    shadowMoves: [],
    currentTurn: 'player',
    battleLog: [],
    isAnimating: false,
    battleEnded: false,
    winner: null,
  });

  const initializeBattle = useCallback(async (playerPokemonId: number) => {
    try {
      const playerPokemon = await pokemonService.getPokemon(playerPokemonId);
      const shadowPokemon = await pokemonService.getRandomPokemon();

      if (!playerPokemon || !shadowPokemon) {
        console.error('Failed to load Pokemon for battle');
        return false;
      }

      const playerMoves = await pokemonService.getPokemonMoves(playerPokemon);
      const shadowMoves = await pokemonService.getPokemonMoves(shadowPokemon);

      const maxHP = Math.floor(pokemonService.getStatValue(playerPokemon, 'hp') * 1.5);

      setBattleState({
        playerPokemon,
        shadowPokemon,
        playerHP: maxHP,
        playerMaxHP: maxHP,
        shadowHP: maxHP,
        shadowMaxHP: maxHP,
        playerMoves,
        shadowMoves,
        currentTurn: 'player',
        battleLog: [`Battle started! ${playerPokemon.name} vs ${shadowPokemon.name}`],
        isAnimating: false,
        battleEnded: false,
        winner: null,
      });

      return true;
    } catch (error) {
      console.error('Error initializing battle:', error);
      return false;
    }
  }, []);

  const calculateDamage = useCallback((
    attacker: PokemonData,
    defender: PokemonData,
    move: MoveData,
    isStab: boolean
  ): number => {
    const level = 50;
    const power = move.power || 50;
    const attackStat = pokemonService.getStatValue(attacker, 'attack');
    const defenseStat = pokemonService.getStatValue(defender, 'defense');
    const stabBonus = isStab ? 1.5 : 1;
    const randomFactor = 0.85 + Math.random() * 0.15;

    const damage = Math.floor(
      ((((2 * level / 5 + 2) * power * (attackStat / defenseStat)) / 50) + 2) *
      stabBonus *
      randomFactor
    );

    return Math.max(1, damage);
  }, []);

  const playerAttack = useCallback(async (moveIndex: number) => {
    if (battleState.currentTurn !== 'player' || battleState.isAnimating) return false;

    setBattleState(prev => ({ ...prev, isAnimating: true }));

    const move = battleState.playerMoves[moveIndex];
    const isStab = pokemonService.getTypes(battleState.playerPokemon!).includes(move.type.name);
    const damage = calculateDamage(battleState.playerPokemon!, battleState.shadowPokemon!, move, isStab);

    const newShadowHP = Math.max(0, battleState.shadowHP - damage);
    const battleEnded = newShadowHP <= 0;

    // Record move for AI training
    try {
      await aiAPI.recordMove({
        id: 0,
        playerName,
        pokemonId: battleState.playerPokemon!.id,
        pokemonName: battleState.playerPokemon!.name,
        moveUsed: move.name,
        moveCount: 1,
        successRate: 100,
        moveHistory: move.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to record AI training:', err);
    }

    // Broadcast move via WebSocket
    wsManager.send({
      type: 'battle_move',
      playerName,
      move: move.name,
      damage,
    });

    setBattleState(prev => ({
      ...prev,
      shadowHP: newShadowHP,
      battleLog: [...prev.battleLog, `${battleState.playerPokemon!.name} used ${move.name}! Dealt ${damage} damage!`],
      currentTurn: 'shadow',
      battleEnded,
      winner: battleEnded ? 'player' : null,
      isAnimating: false,
    }));

    if (!battleEnded) {
      setTimeout(() => shadowAttack(), 1500);
    }

    return true;
  }, [battleState, calculateDamage, playerName, shadowAttack]);

  const shadowAttack = useCallback(async () => {
    if (battleState.currentTurn !== 'shadow' || battleState.battleEnded) return;

    setBattleState(prev => ({ ...prev, isAnimating: true }));

    // Get counter move from AI
    await aiAPI.getCounterMove(
      playerName,
      battleState.playerPokemon!.id,
      battleState.shadowPokemon!.id
    );

    const move = battleState.shadowMoves[Math.floor(Math.random() * battleState.shadowMoves.length)];
    const isStab = pokemonService.getTypes(battleState.shadowPokemon!).includes(move.type.name);
    const damage = calculateDamage(battleState.shadowPokemon!, battleState.playerPokemon!, move, isStab);

    const newPlayerHP = Math.max(0, battleState.playerHP - damage);
    const battleEnded = newPlayerHP <= 0;

    setBattleState(prev => ({
      ...prev,
      playerHP: newPlayerHP,
      battleLog: [...prev.battleLog, `Shadow's ${battleState.shadowPokemon!.name} used ${move.name}! Dealt ${damage} damage!`],
      currentTurn: 'player',
      battleEnded,
      winner: battleEnded ? 'shadow' : null,
      isAnimating: false,
    }));
  }, [battleState, calculateDamage, playerName]);

  const endBattle = useCallback(async (won: boolean) => {
    if (!battleState.battleEnded) return;

    try {
      await battleAPI.record({
        id: 0,
        playerName,
        levelNumber: 1, // Should be passed as parameter
        playerPokemonId: battleState.playerPokemon!.id,
        playerPokemonName: battleState.playerPokemon!.name,
        shadowPokemonId: battleState.shadowPokemon!.id,
        shadowPokemonName: battleState.shadowPokemon!.name,
        result: won ? 'WIN' : 'LOSS',
        battleLog: battleState.battleLog.join('\n'),
        battleDurationMs: 0, // Should calculate actual duration
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording battle:', error);
    }
  }, [battleState, playerName]);

  return {
    battleState,
    initializeBattle,
    playerAttack,
    shadowAttack,
    endBattle,
  };
}

export function useMultiplayer(playerName: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState<Map<string, { x: number; y: number; lastUpdate: number }>>(new Map());

  const connect = useCallback(async () => {
    try {
      await wsManager.connect(playerName, 
        () => setIsConnected(true),
        (error) => console.error('WebSocket error:', error)
      );

      // Listen for player movements
      wsManager.on('player_move', (data: unknown) => {
        const msg = data as Partial<PlayerMoveMessage>;
        if (msg.type !== 'player_move' || typeof msg.playerName !== 'string') return;
        setOtherPlayers(prev => {
          const updated = new Map(prev);
          updated.set(msg.playerName, {
            x: typeof msg.x === 'number' ? msg.x : 0,
            y: typeof msg.y === 'number' ? msg.y : 0,
            lastUpdate: Date.now(),
          });
          return updated;
        });
      });

      // Listen for player leaving
      wsManager.on('player_left', (data: unknown) => {
        const msg = data as Partial<PlayerLeftMessage>;
        if (msg.type !== 'player_left' || typeof msg.playerName !== 'string') return;
        setOtherPlayers(prev => {
          const updated = new Map(prev);
          updated.delete(msg.playerName);
          return updated;
        });
      });

      return true;
    } catch (error) {
      console.error('Error connecting to multiplayer:', error);
      return false;
    }
  }, [playerName]);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
    setIsConnected(false);
    setOtherPlayers(new Map());
  }, []);

  const broadcastMove = useCallback((x: number, y: number) => {
    wsManager.send({
      type: 'move',
      playerName,
      x,
      y,
    });
  }, [playerName]);

  return {
    isConnected,
    otherPlayers,
    connect,
    disconnect,
    broadcastMove,
  };
}
