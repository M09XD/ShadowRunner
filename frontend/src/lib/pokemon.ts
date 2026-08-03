// Pokemon Service - Fetches data from PokeAPI
const POKE_API_BASE = 'https://pokeapi.co/api/v2';

export interface PokemonData {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    back_default: string;
    other?: {
      'official-artwork'?: {
        front_default: string;
      };
    };
  };
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
      url?: string;
    };
  }>;
  types: Array<{
    type: {
      name: string;
      url?: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
      url?: string;
    };
  }>;
  moves: Array<{
    move: {
      name: string;
      url?: string;
    };
  }>;
  height: number;
  weight: number;
}

export interface MoveData {
  id: number;
  name: string;
  power: number | null;
  pp: number;
  accuracy: number | null;
  type: {
    name: string;
    url?: string;
  };
  damage_class: {
    name: string;
    url?: string;
  };
}

class PokemonService {
  async getPokemon(idOrName: number | string): Promise<PokemonData | null> {
    try {
      const response = await fetch(`${POKE_API_BASE}/pokemon/${idOrName}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching Pokemon:', error);
      return null;
    }
  }

  async getPokemonList(limit: number = 20, offset: number = 0): Promise<{ pokemon: PokemonData[]; total: number }> {
    try {
      const response = await fetch(`${POKE_API_BASE}/pokemon?limit=${limit}&offset=${offset}`);
      if (!response.ok) return { pokemon: [], total: 0 };
      
      const data: { results: Array<{ name: string }>; count: number } = await response.json();
      const pokemon = await Promise.all(
        data.results.map((p) => this.getPokemon(p.name))
      );
      
      return {
        pokemon: pokemon.filter((p): p is PokemonData => p !== null),
        total: data.count,
      };
    } catch (error) {
      console.error('Error fetching Pokemon list:', error);
      return { pokemon: [], total: 0 };
    }
  }

  async searchPokemon(query: string, limit: number = 1025): Promise<PokemonData[]> {
    try {
      const response = await fetch(`${POKE_API_BASE}/pokemon?limit=${limit}`);
      if (!response.ok) return [];

      const data = await response.json();
      const filtered = data.results.filter((p: { name: string }) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );

      const pokemon = await Promise.all(
        filtered.slice(0, 20).map((p: { name: string }) => this.getPokemon(p.name))
      );

      return pokemon.filter((p): p is PokemonData => p !== null);
    } catch (error) {
      console.error('Error searching Pokemon:', error);
      return [];
    }
  }

  async getMove(moveName: string): Promise<MoveData | null> {
    try {
      const response = await fetch(`${POKE_API_BASE}/move/${moveName.toLowerCase()}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching move:', error);
      return null;
    }
  }

  async getPokemonMoves(pokemon: PokemonData): Promise<MoveData[]> {
    try {
      const moves = pokemon.moves.slice(0, 4); // Get first 4 moves
      const moveData = await Promise.all(
        moves.map(m => this.getMove(m.move.name))
      );
      return moveData.filter((m): m is MoveData => m !== null);
    } catch (error) {
      console.error('Error fetching Pokemon moves:', error);
      return [];
    }
  }

  getStatValue(pokemon: PokemonData, statName: string): number {
    const stat = pokemon.stats.find(s => s.stat.name === statName);
    return stat?.base_stat || 0;
  }

  getTypes(pokemon: PokemonData): string[] {
    return pokemon.types.map(t => t.type.name);
  }

  getAbilities(pokemon: PokemonData): string[] {
    return pokemon.abilities.map(a => a.ability.name);
  }

  getOfficialArtwork(pokemon: PokemonData): string {
    return (
      pokemon.sprites.other?.['official-artwork']?.front_default ||
      pokemon.sprites.front_default ||
      ''
    );
  }

  getRandomPokemon(): Promise<PokemonData | null> {
    const randomId = Math.floor(Math.random() * 1025) + 1;
    return this.getPokemon(randomId);
  }
}

export const pokemonService = new PokemonService();
