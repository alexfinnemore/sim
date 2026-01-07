import { Character } from './character';
import { Relationship } from './graph';

// Player actions available each turn
export type PlayerActionType = 'pursue' | 'maintain' | 'distance' | 'end' | 'skip';

export interface PlayerAction {
  type: PlayerActionType;
  targetId?: string; // Required for pursue, maintain, distance, end
}

// Event that occurred during simulation
export interface SimulationEvent {
  turn: number;
  type: string;
  description: string;
  characterIds: string[];
  data?: Record<string, unknown>;
}

// Configuration for a simulation
export interface SimulationConfig {
  populationSize: number;
  actionsPerTurn: number; // How many actions the player gets
  enabledDynamics: string[];
  parameters: Record<string, Record<string, number | boolean | string>>;
}

// Full simulation state
export interface SimulationState {
  id: string;
  turn: number;
  characters: Character[];
  playerCharacterId: string | null;
  events: SimulationEvent[];
  config: SimulationConfig;
  phase: 'setup' | 'player_turn' | 'npc_turn' | 'resolution' | 'ended';
}

// Default simulation config
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  populationSize: 50,
  actionsPerTurn: 3,
  enabledDynamics: ['prisoners_dilemma'],
  parameters: {},
};
