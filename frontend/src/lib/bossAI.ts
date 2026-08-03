// Boss AI System - Final Level (Level 16 - The Shadow)
// Uses all accumulated AI training data to select optimal Pokemon and moves
// No randomness - fully optimized AI decisions
// Analyzes player history to counter their strategies

import { Pokemon, MoveDetails } from '@/types/game';
import { aiAPI } from '@/lib/api';
import { getPlayerTimeLogs, getAllTimeLogs } from '@/lib/levelProgress';

export interface BossAIDecision {
  pokemonId: number;
  pokemon: Pokemon;
  optimalMoves: MoveDetails[];
  strategy: 'aggressive' | 'defensive' | 'balanced';
  confidence: number; // 0-1, how confident the AI is in this decision
}

export interface PlayerBattleAnalysis {
  preferredPokemonIds: number[];
  preferredMoves: string[];
  winRate: number;
  averageHealth: number;
  preferredStrategy: 'offensive' | 'defensive' | 'balanced';
}

// Analyze player's full battle history to build counter strategy
async function analyzePlayerBattleHistory(
  playerName: string
): Promise<PlayerBattleAnalysis> {
  try {
    // Get all training data for this player
    const trainingData = await aiAPI.getTrainingData(playerName);
    
    if (!trainingData || trainingData.length === 0) {
      // No data - return neutral analysis
      return {
        preferredPokemonIds: [],
        preferredMoves: [],
        winRate: 0.5,
        averageHealth: 0.5,
        preferredStrategy: 'balanced',
      };
    }
    
    // Analyze Pokemon usage
    const pokemonUsage = new Map<number, number>();
    const moveUsage = new Map<string, number>();
    let wins = 0;
    let totalBattles = trainingData.length;
    let totalHealth = 0;
    
    trainingData.forEach(data => {
      // Count Pokemon usage
      const count = pokemonUsage.get(data.pokemonId) || 0;
      pokemonUsage.set(data.pokemonId, count + 1);
      
      // Count move usage
      const moveCount = moveUsage.get(data.moveName) || 0;
      moveUsage.set(data.moveName, moveCount + 1);
      
      // Calculate win rate
      if (data.wonBattle) wins++;
      
      // Average health at end of battle
      totalHealth += data.endingHealth || 0.5;
    });
    
    // Get most used Pokemon (top 3)
    const preferredPokemon = Array.from(pokemonUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    
    // Get most used moves (top 5)
    const preferredMoves = Array.from(moveUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
    
    // Determine strategy based on move types
    let offensiveCount = 0;
    let defensiveCount = 0;
    preferredMoves.forEach(move => {
      if (['Minimize', 'Barrier', 'Reflect', 'Defense Curl', 'Protect'].includes(move)) {
        defensiveCount++;
      } else if (['Earthquake', 'Hydro Pump', 'Flare Blitz', 'Outrage', 'Hyper Beam'].includes(move)) {
        offensiveCount++;
      }
    });
    
    const preferredStrategy: 'offensive' | 'defensive' | 'balanced' =
      offensiveCount > defensiveCount ? 'offensive' :
      defensiveCount > offensiveCount ? 'defensive' :
      'balanced';
    
    return {
      preferredPokemonIds: preferredPokemon,
      preferredMoves,
      winRate: wins / totalBattles,
      averageHealth: totalHealth / totalBattles,
      preferredStrategy,
    };
  } catch (error) {
    console.error('Error analyzing player battle history:', error);
    return {
      preferredPokemonIds: [],
      preferredMoves: [],
      winRate: 0.5,
      averageHealth: 0.5,
      preferredStrategy: 'balanced',
    };
  }
}

// Select the optimal boss Pokemon to counter player strategy
export async function selectOptimalBossPokemon(
  playerName: string,
  availablePokemon: Pokemon[]
): Promise<{ pokemon: Pokemon; confidence: number }> {
  try {
    // Analyze player's battle history
    const analysis = await analyzePlayerBattleHistory(playerName);
    
    // If no data, select strongest Pokemon
    if (analysis.preferredPokemonIds.length === 0) {
      const strongest = availablePokemon.reduce((best, current) => {
        const currentTotal = current.stats?.reduce((sum, stat) => sum + stat.base_stat, 0) || 0;
        const bestTotal = best.stats?.reduce((sum, stat) => sum + stat.base_stat, 0) || 0;
        return currentTotal > bestTotal ? current : best;
      });
      return { pokemon: strongest, confidence: 0.3 }; // Low confidence without data
    }
    
    // Find Pokemon that counters player's preferred Pokemon
    let bestCounter: Pokemon | null = null;
    let bestScore = -1;
    
    for (const pokemon of availablePokemon) {
      let counterScore = 0;
      
      // Check type advantages against player's preferred Pokemon
      for (const playerPokemonId of analysis.preferredPokemonIds) {
        const playerPokemon = availablePokemon.find(p => p.id === playerPokemonId);
        if (playerPokemon) {
          const typeAdvantage = calculateTypeAdvantageScore(pokemon, playerPokemon);
          counterScore += typeAdvantage * 2;
        }
      }
      
      // Add base stats
      const totalStats = pokemon.stats?.reduce((sum, stat) => sum + stat.base_stat, 0) || 0;
      counterScore += totalStats / 10;
      
      // Adjust based on player's strategy
      if (analysis.preferredStrategy === 'offensive') {
        // Select defensive Pokemon
        const defenseStats = pokemon.stats?.find(s => s.stat.name === 'defense')?.base_stat || 50;
        const hpStats = pokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || 50;
        counterScore += (defenseStats + hpStats) / 10;
      } else if (analysis.preferredStrategy === 'defensive') {
        // Select offensive Pokemon
        const attackStats = pokemon.stats?.find(s => s.stat.name === 'attack')?.base_stat || 50;
        const spAtk = pokemon.stats?.find(s => s.stat.name === 'sp. atk')?.base_stat || 50;
        counterScore += (attackStats + spAtk) / 10;
      }
      
      if (counterScore > bestScore) {
        bestScore = counterScore;
        bestCounter = pokemon;
      }
    }
    
    // Confidence based on how much data we have
    const dataPoints = (await aiAPI.getTrainingData(playerName))?.length || 0;
    const confidence = Math.min(1, 0.3 + (dataPoints / 100) * 0.7);
    
    return {
      pokemon: bestCounter || availablePokemon[0],
      confidence,
    };
  } catch (error) {
    console.error('Error selecting boss Pokemon:', error);
    const strongest = availablePokemon.reduce((best, current) => {
      const currentTotal = current.stats?.reduce((sum, stat) => sum + stat.base_stat, 0) || 0;
      const bestTotal = best.stats?.reduce((sum, stat) => sum + stat.base_stat, 0) || 0;
      return currentTotal > bestTotal ? current : best;
    });
    return { pokemon: strongest, confidence: 0.2 };
  }
}

// Select optimal move using complete AI analysis
export async function selectOptimalBossMove(
  playerName: string,
  playerPokemonId: number,
  shadowPokemonId: number,
  shadowHealth: number,
  playerHealth: number,
  availableMoves: MoveDetails[]
): Promise<{ move: MoveDetails; confidence: number }> {
  try {
    // Get AI prediction for counter move
    const counterMoveName = await aiAPI.getCounterMove(playerName, playerPokemonId, shadowPokemonId);
    
    // Find the predicted move
    const predictedMove = availableMoves.find(m => 
      m.name.toLowerCase().replace(/\s+/g, '-') === counterMoveName?.toLowerCase().replace(/\s+/g, '-')
    );
    
    if (predictedMove) {
      return { move: predictedMove, confidence: 0.8 }; // High confidence in prediction
    }
    
    // Fallback: Select move based on game state
    return selectMoveByGameState(availableMoves, shadowHealth, playerHealth);
  } catch (error) {
    console.error('Error selecting boss move:', error);
    return selectMoveByGameState(availableMoves, shadowHealth, playerHealth);
  }
}

// Helper: Select best move based on current game state
function selectMoveByGameState(
  availableMoves: MoveDetails[],
  shadowHealth: number,
  playerHealth: number
): { move: MoveDetails; confidence: number } {
  // If low health, prioritize healing/defensive moves
  if (shadowHealth < 0.3) {
    const defensiveMove = availableMoves.find(m => 
      ['recover', 'restore', 'synthesis', 'roost', 'aqua ring'].includes(m.name.toLowerCase())
    );
    if (defensiveMove) {
      return { move: defensiveMove, confidence: 0.7 };
    }
  }
  
  // If player health is low, go for high-power moves
  if (playerHealth < 0.3) {
    const powerMove = availableMoves
      .filter(m => (m.power || 0) >= 90)
      .reduce((best, current) => {
        const currentPower = current.power || 0;
        const bestPower = best.power || 0;
        return currentPower > bestPower ? current : best;
      }, availableMoves[0]);
    return { move: powerMove, confidence: 0.75 };
  }
  
  // Default: Select move with best power/accuracy ratio
  let bestMove = availableMoves[0];
  let bestScore = 0;
  
  for (const move of availableMoves) {
    const power = move.power || 50;
    const accuracy = move.accuracy || 100;
    const score = power * (accuracy / 100);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return { move: bestMove, confidence: 0.6 };
}

// Calculate comprehensive type advantage score
function calculateTypeAdvantageScore(
  attackerPokemon: Pokemon,
  defenderPokemon: Pokemon
): number {
  const attackerTypes = attackerPokemon.types?.map(t => t.type.name) || [];
  const defenderTypes = defenderPokemon.types?.map(t => t.type.name) || [];
  
  let score = 0;
  
  for (const atkType of attackerTypes) {
    for (const defType of defenderTypes) {
      const advantage = getTypeAdvantage(atkType, defType);
      score += advantage;
    }
  }
  
  return score / (attackerTypes.length * defenderTypes.length);
}

// Comprehensive type advantage table
function getTypeAdvantage(attackType: string, defenseType: string): number {
  // Complete type effectiveness chart
  const typeChart: Record<string, Record<string, number>> = {
    'normal': { 'rock': 0.5, 'ghost': 0, 'steel': 0.5 },
    'fire': { 'fire': 0.5, 'water': 0.5, 'grass': 2, 'ice': 2, 'bug': 2, 'steel': 2, 'rock': 0.5, 'dragon': 0.5 },
    'water': { 'fire': 2, 'water': 0.5, 'grass': 0.5, 'ground': 2, 'rock': 2, 'dragon': 0.5 },
    'electric': { 'water': 2, 'electric': 0.5, 'grass': 0.5, 'ground': 0, 'flying': 2, 'dragon': 0.5 },
    'grass': { 'fire': 0.5, 'water': 2, 'grass': 0.5, 'poison': 0.5, 'ground': 2, 'flying': 0.5, 'bug': 0.5, 'rock': 2, 'dragon': 0.5, 'steel': 0.5 },
    'ice': { 'fire': 0.5, 'water': 0.5, 'grass': 2, 'ice': 0.5, 'ground': 2, 'flying': 2, 'dragon': 2, 'steel': 0.5 },
    'fighting': { 'normal': 2, 'flying': 0.5, 'poison': 0.5, 'rock': 2, 'bug': 0.5, 'ghost': 0, 'dark': 2, 'steel': 2, 'psychic': 0.5, 'fairy': 0.5 },
    'poison': { 'grass': 2, 'poison': 0.5, 'ground': 0.5, 'rock': 0.5, 'ghost': 0.5, 'steel': 0, 'fairy': 2 },
    'ground': { 'fire': 2, 'electric': 2, 'grass': 0.5, 'poison': 2, 'rock': 2, 'water': 0, 'flying': 0, 'bug': 0.5, 'steel': 2 },
    'flying': { 'fighting': 2, 'bug': 2, 'grass': 2, 'rock': 0.5, 'steel': 0.5, 'electric': 0.5 },
    'psychic': { 'fighting': 2, 'poison': 2, 'psychic': 0.5, 'dark': 0, 'steel': 0.5 },
    'bug': { 'fire': 0.5, 'grass': 2, 'fighting': 0.5, 'poison': 0.5, 'flying': 0.5, 'psychic': 2, 'ghost': 0.5, 'dark': 2, 'steel': 0.5, 'fairy': 0.5 },
    'rock': { 'fire': 2, 'ice': 2, 'flying': 2, 'bug': 2, 'grass': 0.5, 'normal': 0.5, 'poison': 0.5, 'ground': 0.5, 'steel': 0.5, 'fighting': 0.5 },
    'ghost': { 'normal': 0, 'psychic': 2, 'ghost': 2, 'dark': 0.5 },
    'dragon': { 'dragon': 2, 'steel': 0.5, 'fairy': 0 },
    'dark': { 'fighting': 0.5, 'psychic': 2, 'ghost': 2, 'dark': 0.5, 'fairy': 0.5 },
    'steel': { 'normal': 2, 'flying': 2, 'rock': 2, 'bug': 2, 'grass': 0.5, 'psychic': 2, 'ice': 2, 'dragon': 2, 'steel': 0.5, 'water': 0.5, 'electric': 0.5, 'poison': 0, 'fairy': 2, 'fire': 0.5, 'ground': 0.5 },
    'fairy': { 'fighting': 2, 'poison': 0.5, 'dark': 2, 'dragon': 2, 'steel': 0.5 },
  };
  
  return typeChart[attackType]?.[defenseType] ?? 1.0;
}

// Get boss strategy based on player analysis
export async function determineBossStrategy(
  playerName: string
): Promise<'aggressive' | 'defensive' | 'balanced'> {
  try {
    const analysis = await analyzePlayerBattleHistory(playerName);
    
    // Counter player's strategy
    if (analysis.preferredStrategy === 'aggressive') {
      return 'defensive'; // Defensive counters aggressive
    } else if (analysis.preferredStrategy === 'defensive') {
      return 'aggressive'; // Aggressive breaks through defense
    }
    
    return 'balanced'; // Default strategy
  } catch (error) {
    console.error('Error determining boss strategy:', error);
    return 'balanced';
  }
}
