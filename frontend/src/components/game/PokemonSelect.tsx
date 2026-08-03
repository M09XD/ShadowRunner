import React, { useState, useEffect, useCallback } from 'react';
import { Pokemon } from '@/types/game';

interface PokemonSelectProps {
  allPokemon: { id: number; name: string; url: string }[];
  loadingPokemon: boolean;
  selectionTimer: number;
  onSelect: (pokemonId: number) => void;
  fetchPokemonDetails: (id: number) => Promise<Pokemon | null>;
  fetchAllPokemon: () => Promise<void>;
}

export const PokemonSelect: React.FC<PokemonSelectProps> = ({
  allPokemon,
  loadingPokemon,
  selectionTimer,
  onSelect,
  fetchPokemonDetails,
  fetchAllPokemon,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredPokemon, setHoveredPokemon] = useState<Pokemon | null>(null);
  const [loadingHover, setLoadingHover] = useState(false);
  const [page, setPage] = useState(0);
  const itemsPerPage = 50;

  useEffect(() => {
    if (allPokemon.length === 0) {
      fetchAllPokemon();
    }
  }, [allPokemon.length, fetchAllPokemon]);

  const filteredPokemon = allPokemon.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  const paginatedPokemon = filteredPokemon.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const totalPages = Math.ceil(filteredPokemon.length / itemsPerPage);

  const handleHover = useCallback(async (pokemonId: number) => {
    setLoadingHover(true);
    const details = await fetchPokemonDetails(pokemonId);
    setHoveredPokemon(details);
    setLoadingHover(false);
  }, [fetchPokemonDetails]);

  const typeColors: Record<string, string> = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-950 via-black to-purple-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-black/80 border-b-4 border-red-600 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            SELECT YOUR POKEMON
          </h1>
          <div className={`text-4xl font-bold ${selectionTimer <= 3 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}
               style={{ fontFamily: '"Press Start 2P", monospace' }}>
            {selectionTimer}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pokemon Grid */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search Pokemon by name or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="w-full px-4 py-3 bg-purple-900/50 border-2 border-purple-600 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-purple-400"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
            />
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-purple-900 disabled:opacity-50 text-white rounded-lg transition-colors"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
            >
              PREV
            </button>
            <span className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-purple-900 disabled:opacity-50 text-white rounded-lg transition-colors"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
            >
              NEXT
            </button>
          </div>

          {/* Grid */}
          {loadingPokemon ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-purple-400 animate-pulse" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                Loading Pokemon...
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {paginatedPokemon.map(pokemon => (
                  <button
                    key={pokemon.id}
                    onClick={() => onSelect(pokemon.id)}
                    onMouseEnter={() => handleHover(pokemon.id)}
                    className="group relative bg-purple-900/50 hover:bg-purple-700/70 border-2 border-purple-700 hover:border-yellow-400 rounded-lg p-2 transition-all duration-200 hover:scale-105 hover:z-10"
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                      alt={pokemon.name}
                      className="w-full h-auto pixelated"
                      loading="lazy"
                    />
                    <div className="text-[8px] text-center text-purple-300 group-hover:text-white truncate"
                         style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      #{pokemon.id}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pokemon Details Panel */}
        <div className="w-80 bg-black/60 border-l-4 border-purple-700 p-4 overflow-y-auto">
          {loadingHover ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-purple-400 animate-pulse" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                Loading...
              </div>
            </div>
          ) : hoveredPokemon ? (
            <div className="space-y-4">
              {/* Pokemon Image */}
              <div className="bg-gradient-to-b from-purple-800/50 to-purple-900/50 rounded-lg p-4 text-center">
                <img
                  src={hoveredPokemon.sprites.other?.['official-artwork']?.front_default || hoveredPokemon.sprites.front_default}
                  alt={hoveredPokemon.name}
                  className="w-40 h-40 mx-auto"
                />
              </div>

              {/* Name and ID */}
              <div className="text-center">
                <h2 className="text-xl text-white capitalize" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {hoveredPokemon.name}
                </h2>
                <p className="text-purple-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                  #{hoveredPokemon.id.toString().padStart(4, '0')}
                </p>
              </div>

              {/* Types */}
              <div className="flex justify-center gap-2">
                {hoveredPokemon.types.map(t => (
                  <span
                    key={t.type.name}
                    className="px-3 py-1 rounded-full text-white uppercase"
                    style={{
                      backgroundColor: typeColors[t.type.name] || '#888',
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '8px',
                    }}
                  >
                    {t.type.name}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <h3 className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                  STATS
                </h3>
                {hoveredPokemon.stats.map(stat => (
                  <div key={stat.stat.name} className="flex items-center gap-2">
                    <span className="w-20 text-[8px] text-purple-400 uppercase truncate"
                          style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {stat.stat.name.replace('-', ' ')}
                    </span>
                    <div className="flex-1 h-3 bg-purple-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                        style={{ width: `${Math.min(100, (stat.base_stat / 255) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-[8px] text-white text-right"
                          style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {stat.base_stat}
                    </span>
                  </div>
                ))}
              </div>

              {/* Abilities */}
              <div className="space-y-2">
                <h3 className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                  ABILITIES
                </h3>
                <div className="flex flex-wrap gap-1">
                  {hoveredPokemon.abilities.map(a => (
                    <span
                      key={a.ability.name}
                      className="px-2 py-1 bg-purple-800 rounded text-purple-200 capitalize"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
                    >
                      {a.ability.name.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Select Button */}
              <button
                onClick={() => onSelect(hoveredPokemon.id)}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black rounded-lg transition-all duration-200 hover:scale-105"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
              >
                SELECT
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-purple-500" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                Hover over a Pokemon to see details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timer Warning */}
      {selectionTimer <= 3 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-6xl text-red-500 animate-ping opacity-50" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            {selectionTimer}
          </div>
        </div>
      )}
    </div>
  );
};
