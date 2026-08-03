import { useState, useCallback, useEffect, useRef } from 'react';
import { Pokemon, MoveDetails, BattleState, getTypeEffectiveness, calculateDamage } from '@/types/game';
import { supabase } from '@/lib/supabase';

const POKEMON_API_BASE = 'https://pokeapi.co/api/v2';
const BATTLE_MOVE_DELAY = 1500;
const VICTORY_DELAY = 1000;
const DEFEAT_DELAY = 500;

export function usePokemonBattle() {
  const [battleState, setBattleState] = useState<BattleState>({
    playerPokemon: null,
    shadowPokemon: null,
    playerHP: 0,
    playerMaxHP: 0,
    shadowHP: 0,
    shadowMaxHP: 0,
    playerMoves: [],
    shadowMoves: [],
    currentTurn: 'player',
    battleLog: [],
    isAnimating: false,
    battleEnded: false,
    winner: null,
  });

  const [allPokemon, setAllPokemon] = useState<{ id: number; name: string; url: string }[]>([]);
  const [loadingPokemon, setLoadingPokemon] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [selectionTimer, setSelectionTimer] = useState(10);
  const [isSelecting, setIsSelecting] = useState(false);
  
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const turnNumberRef = useRef<number>(0);
  const isMountedRef = useRef(true); // CRITICAL FIX #16: Track mount status
  const timeoutRefsRef = useRef<Set<NodeJS.Timeout>>(new Set()); // CRITICAL FIX #17: Track timeouts for cleanup
  const battleLockedRef = useRef(false); // CRITICAL FIX #18: Prevent race conditions with turn lock

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up all pending timeouts
      timeoutRefsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefsRef.current.clear();
    };
  }, []);

  // Fetch all Pokemon list - CRITICAL FIX #1: Load all 1025 Pokemon
  const fetchAllPokemon = useCallback(async () => {
    setLoadingPokemon(true);
    try {
      // Load all 1025 Pokemon in a single request (PokeAPI supports up to 1281)
      const response = await fetch(`${POKEMON_API_BASE}/pokemon?limit=1025&offset=0`);
      if (!response.ok) {
        throw new Error(`Failed to fetch Pokemon: ${response.status}`);
      }
      const data = await response.json();
      
      if (isMountedRef.current) {
        // Extract ID from URL: https://pokeapi.co/api/v2/pokemon/1/
        const pokemonList = data.results.map((p: { name: string; url: string }) => {
          const urlParts = p.url.split('/');
          const id = parseInt(urlParts[urlParts.length - 2] || '0', 10);
          return {
            id: id || 0,
            name: p.name,
            url: p.url,
          };
        }).filter((p: { id: number }) => p.id > 0); // Filter out invalid IDs
        
        setAllPokemon(pokemonList);
      }
    } catch (error) {
      console.error('Failed to fetch Pokemon list:', error);
      // Fallback: try loading in smaller batches
      try {
        const batches = [];
        for (let offset = 0; offset < 1025; offset += 100) {
          const response = await fetch(`${POKEMON_API_BASE}/pokemon?limit=100&offset=${offset}`);
          if (response.ok) {
            const data = await response.json();
            batches.push(...data.results);
          }
        }
        if (isMountedRef.current && batches.length > 0) {
          const pokemonList = batches.map((p: { name: string; url: string }) => {
            const urlParts = p.url.split('/');
            const id = parseInt(urlParts[urlParts.length - 2] || '0', 10);
            return { id: id || 0, name: p.name, url: p.url };
          }).filter((p: { id: number }) => p.id > 0);
          setAllPokemon(pokemonList);
        }
      } catch (fallbackError) {
        console.error('Fallback Pokemon loading also failed:', fallbackError);
      }
    }
    if (isMountedRef.current) {
      setLoadingPokemon(false);
    }
  }, []);

  // Fetch detailed Pokemon data with null checks
  const fetchPokemonDetails = useCallback(async (idOrName: number | string): Promise<Pokemon | null> => {
    try {
      const response = await fetch(`${POKEMON_API_BASE}/pokemon/${idOrName}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data as Pokemon;
    } catch (error) {
      console.error('Failed to fetch Pokemon details:', error);
      return null;
    }
  }, []);

  // Fetch move details with error handling
  const fetchMoveDetails = useCallback(async (moveUrl: string): Promise<MoveDetails | null> => {
    try {
      const response = await fetch(moveUrl);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        power: data.power || 0,
        pp: data.pp || 0,
        accuracy: data.accuracy || 100,
        type: data.type || { name: 'normal' },
        damage_class: data.damage_class || { name: 'physical' },
      };
    } catch (error) {
      console.error('Failed to fetch move details:', error);
      return null;
    }
  }, []);

  // Get 4 random damaging moves for a Pokemon with improved efficiency
  const getRandomMoves = useCallback(async (pokemon: Pokemon): Promise<MoveDetails[]> => {
    const damagingMoves = pokemon.moves.filter(m => m.move.url);
    const shuffled = damagingMoves.sort(() => Math.random() - 0.5).slice(0, 8);
    
    const moveDetails: MoveDetails[] = [];
    for (const move of shuffled) {
      const details = await fetchMoveDetails(move.move.url);
      if (details && details.power && details.power > 0) {
        moveDetails.push(details);
        if (moveDetails.length >= 4) break;
      }
    }

    // If not enough damaging moves, add default tackle
    while (moveDetails.length < 4) {
      moveDetails.push({
        id: 33,
        name: 'tackle',
        power: 40,
        pp: 35,
        accuracy: 100,
        type: { name: 'normal' },
        damage_class: { name: 'physical' },
      });
    }

    return moveDetails;
  }, [fetchMoveDetails]);

  // Start Pokemon selection with timer
  const startSelection = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsSelecting(true);
    setSelectionTimer(10);
    setSelectedPokemon(null);
    
    if (allPokemon.length === 0) {
      await fetchAllPokemon();
    }
  }, [allPokemon.length, fetchAllPokemon]);

  // Selection timer with cleanup
  useEffect(() => {
    if (!isSelecting || selectionTimer <= 0) return;

    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setSelectionTimer(prev => {
          if (prev <= 1) {
            // Auto-select random Pokemon
            if (!selectedPokemon && allPokemon.length > 0) {
              const randomId = Math.floor(Math.random() * allPokemon.length) + 1;
              selectPokemon(randomId);
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    const timeoutRef = timer;
    timeoutRefsRef.current.add(timeoutRef);

    return () => {
      clearTimeout(timeoutRef);
      timeoutRefsRef.current.delete(timeoutRef);
    };
  }, [isSelecting, selectionTimer, selectedPokemon, allPokemon]);

  // Select a Pokemon
  const selectPokemon = useCallback(async (pokemonId: number) => {
    const pokemon = await fetchPokemonDetails(pokemonId);
    if (pokemon && isMountedRef.current) {
      setSelectedPokemon(pokemon);
      setIsSelecting(false);
    }
  }, [fetchPokemonDetails]);

  // Initialize battle with proper null checks
  const initializeBattle = useCallback(async (playerPokemon: Pokemon | null, isBossLevel?: boolean, playerName?: string) => {
    if (!playerPokemon || !isMountedRef.current) return;
    
    turnNumberRef.current = 0;
    battleLockedRef.current = false;
    
    try {
      let shadowPokemon: Pokemon | null = null;
      
      if (isBossLevel) {
        // Boss level: Use optimal AI selection
        try {
          const { selectOptimalBossPokemon } = await import('@/lib/bossAI');
          // Get all available Pokemon
          const allPokemonData = await Promise.all(
            Array.from({ length: 20 }, () => {
              const randomId = Math.floor(Math.random() * 1025) + 1;
              return fetchPokemonDetails(randomId).catch(() => null);
            })
          );
          const availablePokemon = allPokemonData.filter((p): p is Pokemon => p !== null);
          shadowPokemon = await selectOptimalBossPokemon(playerName || 'player', availablePokemon);
        } catch (error) {
          console.error('Error selecting boss Pokemon:', error);
          // Fallback to random
          const shadowPokemonId = Math.floor(Math.random() * 1025) + 1;
          shadowPokemon = await fetchPokemonDetails(shadowPokemonId);
        }
      } else {
        // Normal level: Random Pokemon
        const shadowPokemonId = Math.floor(Math.random() * 1025) + 1;
        shadowPokemon = await fetchPokemonDetails(shadowPokemonId);
      }

      if (!shadowPokemon || !isMountedRef.current) {
        console.error('Failed to fetch shadow Pokemon');
        return;
      }

      // Get moves for both Pokemon
      const [playerMoves, shadowMoves] = await Promise.all([
        getRandomMoves(playerPokemon),
        getRandomMoves(shadowPokemon),
      ]);

      if (!isMountedRef.current) return;

      // Calculate HP from stats with fallback
      const playerHP = playerPokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || 100;
      const shadowHP = shadowPokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || 100;

      setBattleState({
        playerPokemon,
        shadowPokemon,
        playerHP: playerHP * 2,
        playerMaxHP: playerHP * 2,
        shadowHP: shadowHP * 2,
        shadowMaxHP: shadowHP * 2,
        playerMoves,
        shadowMoves,
        currentTurn: 'player',
        battleLog: [
          `A wild Shadow appeared with ${shadowPokemon.name.toUpperCase()}!`,
          `Go, ${playerPokemon.name.toUpperCase()}!`,
        ],
        isAnimating: false,
        battleEnded: false,
        winner: null,
      });
    } catch (error) {
      console.error('Error initializing battle:', error);
    }
  }, [fetchPokemonDetails, getRandomMoves]);

  // Execute player move with race condition prevention - CRITICAL FIX #2: Proper state management
  const executePlayerMove = useCallback(async (move: MoveDetails) => {
    // CRITICAL FIX #20: Use turn lock to prevent multiple moves per turn
    if (battleLockedRef.current || !isMountedRef.current) return;
    
    // Use functional update to get latest state
    setBattleState(prev => {
      if (prev.isAnimating || prev.currentTurn !== 'player' || prev.battleEnded || !prev.shadowPokemon || !prev.playerPokemon) {
        return prev; // No change if invalid state
      }
      
      // Lock immediately to prevent race conditions
      battleLockedRef.current = true;
      turnNumberRef.current++;
      
      // Record move for AI training (non-blocking, fire and forget)
      const playerPokemonId = prev.playerPokemon.id;
      const moveName = move.name;
      const currentTurn = turnNumberRef.current;
      
      // Use API instead of Supabase function
      fetch('http://localhost:8081/api/ai/record-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: 'player', // TODO: Get from context
          pokemonId: playerPokemonId,
          pokemonName: prev.playerPokemon.name,
          moveUsed: moveName,
        }),
      }).catch(err => console.error('Error recording move:', err));

      // Calculate damage with proper null checks
      const attackerTypes = prev.playerPokemon.types?.map(t => t.type.name) || [];
      const defenderTypes = prev.shadowPokemon.types?.map(t => t.type.name) || [];
      const effectiveness = getTypeEffectiveness(move.type.name, defenderTypes);
      const isStab = attackerTypes.includes(move.type.name);

      const attackStat = prev.playerPokemon.stats?.find(s => 
        s.stat.name === (move.damage_class.name === 'physical' ? 'attack' : 'special-attack')
      )?.base_stat || 50;
      
      const defenseStat = prev.shadowPokemon.stats?.find(s => 
        s.stat.name === (move.damage_class.name === 'physical' ? 'defense' : 'special-defense')
      )?.base_stat || 50;

      const damage = calculateDamage(50, move.power || 50, attackStat, defenseStat, effectiveness, isStab);

      let effectivenessText = '';
      if (effectiveness > 1) effectivenessText = "It's super effective!";
      else if (effectiveness < 1 && effectiveness > 0) effectivenessText = "It's not very effective...";
      else if (effectiveness === 0) effectivenessText = "It doesn't affect the opponent...";

      const newShadowHP = Math.max(0, prev.shadowHP - damage);
      const battleEnded = newShadowHP <= 0;

      // Update state immediately
      const newState = {
        ...prev,
        shadowHP: newShadowHP,
        currentTurn: 'shadow' as const,
        isAnimating: true,
        battleLog: [
          ...prev.battleLog,
          `${prev.playerPokemon.name.toUpperCase()} used ${move.name.toUpperCase().replace('-', ' ')}!`,
          effectivenessText,
          `Dealt ${damage} damage!`,
        ].filter(Boolean),
        battleEnded,
        winner: battleEnded ? ('player' as const) : null,
      };

      // Schedule shadow's turn if battle continues
      if (!battleEnded) {
        const timeout = setTimeout(() => {
          if (isMountedRef.current) {
            // Execute shadow move - it will read latest state via functional update
            executeShadowMove();
          }
        }, BATTLE_MOVE_DELAY);
        timeoutRefsRef.current.add(timeout);
      } else {
        // Battle ended, schedule victory message
        const timeout = setTimeout(() => {
          if (isMountedRef.current) {
            setBattleState(prevState => ({
              ...prevState,
              isAnimating: false,
              battleLog: [...prevState.battleLog, `${prevState.shadowPokemon?.name.toUpperCase()} fainted!`, 'You won the battle!'],
            }));
          }
        }, VICTORY_DELAY);
        timeoutRefsRef.current.add(timeout);
      }

      // Unlock after state update is scheduled
      setTimeout(() => {
        battleLockedRef.current = false;
      }, 100);

      return newState;
    });
  }, []); // CRITICAL FIX #12: No dependencies needed - uses functional updates

  // Execute Shadow's move with proper state handling - CRITICAL FIX #3: Use functional updates
  const executeShadowMove = useCallback(() => {
    if (!isMountedRef.current) return;

    // Use functional update to get latest state
    setBattleState(prev => {
      if (prev.battleEnded || !prev.shadowPokemon || !prev.playerPokemon || prev.currentTurn !== 'shadow') {
        return prev; // Invalid state, no change
      }

      // Get AI prediction - for boss level, use optimal move selection
      const shadowMoves = prev.shadowMoves;
      let shadowMove = shadowMoves[Math.floor(Math.random() * shadowMoves.length)];
      
      const playerPokemonId = prev.playerPokemon.id;
      const shadowPokemonId = prev.shadowPokemon.id;
      const playerName = localStorage.getItem('playerName') || 'player';
      const isBossLevel = localStorage.getItem('isBossLevel') === 'true';
      
      // For boss level, fetch optimal move asynchronously (use immediately, update for next turn if needed)
      if (isBossLevel) {
        // Use AI API to get counter move (synchronous fetch with fallback)
        fetch(`http://localhost:8081/api/ai/counter/${playerName}/${playerPokemonId}/${shadowPokemonId}`)
          .then(res => res.ok ? res.text() : null)
          .then(predictedMoveName => {
            if (predictedMoveName) {
              const normalizedName = predictedMoveName.toLowerCase().replace(/-/g, ' ');
              const matchingMove = shadowMoves.find(m => 
                m.name.toLowerCase().replace(/-/g, ' ') === normalizedName
              );
              if (matchingMove) {
                // Use this move for current turn (update state if still in shadow turn)
                setBattleState(currentState => {
                  if (currentState.battleEnded || currentState.currentTurn !== 'shadow') {
                    return currentState;
                  }
                  // Recalculate with optimal move
                  const optimalMove = matchingMove;
                  const attackerTypes = currentState.shadowPokemon?.types?.map(t => t.type.name) || [];
                  const defenderTypes = currentState.playerPokemon?.types?.map(t => t.type.name) || [];
                  const effectiveness = getTypeEffectiveness(optimalMove.type?.name || 'normal', defenderTypes);
                  const isStab = attackerTypes.includes(optimalMove.type?.name || 'normal');
                  const attackStat = currentState.shadowPokemon?.stats?.find(s => 
                    s.stat.name === (optimalMove.damage_class?.name === 'physical' ? 'attack' : 'special-attack')
                  )?.base_stat || 50;
                  const defenseStat = currentState.playerPokemon?.stats?.find(s => 
                    s.stat.name === (optimalMove.damage_class?.name === 'physical' ? 'defense' : 'special-defense')
                  )?.base_stat || 50;
                  const damage = calculateDamage(50, optimalMove.power || 50, attackStat, defenseStat, effectiveness, isStab);
                  const newPlayerHP = Math.max(0, (currentState.playerHP || 0) - damage);
                  const battleEnded = newPlayerHP <= 0;
                  
                  return {
                    ...currentState,
                    playerHP: newPlayerHP,
                    currentTurn: 'player' as const,
                    battleLog: [
                      ...currentState.battleLog,
                      `Enemy ${currentState.shadowPokemon?.name.toUpperCase()} used ${optimalMove.name.toUpperCase().replace('-', ' ')}!`,
                      effectiveness > 1 ? "It's super effective!" : effectiveness < 1 ? "It's not very effective..." : '',
                      `Dealt ${damage} damage!`,
                    ].filter(Boolean),
                    isAnimating: false,
                    battleEnded,
                    winner: battleEnded ? ('shadow' as const) : null,
                  };
                });
              }
            }
          })
          .catch(() => {
            // Fallback to random move (already set above)
          });
      } else {
        // Normal level: Fetch AI prediction asynchronously
        fetch(`http://localhost:8081/api/ai/counter/${playerName}/${playerPokemonId}/${shadowPokemonId}`)
          .then(res => res.ok ? res.text() : null)
          .then(predictedMoveName => {
            if (predictedMoveName && shadowMoves.some(m => m.name.toLowerCase().replace(' ', '-') === predictedMoveName.toLowerCase())) {
              const predictedMove = shadowMoves.find(m => m.name.toLowerCase().replace(' ', '-') === predictedMoveName.toLowerCase());
              if (predictedMove) {
                shadowMove = predictedMove;
              }
            }
          })
          .catch(() => {
            // Silently fail, use random move
          });
      }

      // Calculate damage with null checks
      const attackerTypes = prev.shadowPokemon.types?.map(t => t.type.name) || [];
      const defenderTypes = prev.playerPokemon.types?.map(t => t.type.name) || [];
      const effectiveness = getTypeEffectiveness(shadowMove.type?.name || 'normal', defenderTypes);
      const isStab = attackerTypes.includes(shadowMove.type?.name || 'normal');

      const attackStat = prev.shadowPokemon.stats?.find(s => 
        s.stat.name === (shadowMove.damage_class?.name === 'physical' ? 'attack' : 'special-attack')
      )?.base_stat || 50;
      
      const defenseStat = prev.playerPokemon.stats?.find(s => 
        s.stat.name === (shadowMove.damage_class?.name === 'physical' ? 'defense' : 'special-defense')
      )?.base_stat || 50;

      const damage = calculateDamage(50, shadowMove.power || 50, attackStat, defenseStat, effectiveness, isStab);

      let effectivenessText = '';
      if (effectiveness > 1) effectivenessText = "It's super effective!";
      else if (effectiveness < 1 && effectiveness > 0) effectivenessText = "It's not very effective...";
      else if (effectiveness === 0) effectivenessText = "It doesn't affect you...";

      const newPlayerHP = Math.max(0, prev.playerHP - damage);
      const battleEnded = newPlayerHP <= 0;

      const newState = {
        ...prev,
        playerHP: newPlayerHP,
        currentTurn: 'player' as const,
        battleLog: [
          ...prev.battleLog,
          `Enemy ${prev.shadowPokemon.name.toUpperCase()} used ${(shadowMove.name || 'tackle').toUpperCase().replace('-', ' ')}!`,
          effectivenessText,
          `Dealt ${damage} damage!`,
        ].filter(Boolean),
        isAnimating: false,
        battleEnded,
        winner: battleEnded ? ('shadow' as const) : null,
      };

      // Schedule defeat message if battle ended
      if (battleEnded) {
        const timeout = setTimeout(() => {
          if (isMountedRef.current) {
            setBattleState(prevState => ({
              ...prevState,
              battleLog: [...prevState.battleLog, `${prevState.playerPokemon?.name.toUpperCase()} fainted!`, 'You lost the battle...'],
            }));
          }
        }, DEFEAT_DELAY);
        timeoutRefsRef.current.add(timeout);
      }

      return newState;
    });
  }, []);

  // Reset battle with proper cleanup
  const resetBattle = useCallback(() => {
    battleLockedRef.current = false;
    turnNumberRef.current = 0;
    
    if (isMountedRef.current) {
      setBattleState({
        playerPokemon: null,
        shadowPokemon: null,
        playerHP: 0,
        playerMaxHP: 0,
        shadowHP: 0,
        shadowMaxHP: 0,
        playerMoves: [],
        shadowMoves: [],
        currentTurn: 'player',
        battleLog: [],
        isAnimating: false,
        battleEnded: false,
        winner: null,
      });
      setSelectedPokemon(null);
      setIsSelecting(false);
      setSelectionTimer(10);
    }
  }, []);

  return {
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
    executeShadowMove,
    resetBattle,
  };
}
