import { create } from 'zustand';
import {
  SimulationEngine,
  SimulationState,
  Character,
  CharacterAttributes,
  StrategyType,
  PlayerAction,
  Relationship,
} from '@/simulation';

interface SimulationStore {
  // Engine and state
  engine: SimulationEngine | null;
  state: SimulationState | null;

  // UI state
  selectedCharacterId: string | null;
  isPaused: boolean;

  // Actions
  initializeSimulation: (config?: { populationSize?: number }) => void;
  createPlayer: (name: string, attributes: CharacterAttributes, strategy: StrategyType) => void;
  startSimulation: () => void;
  executeActions: (actions: PlayerAction[]) => void;
  advanceTurn: () => void;
  selectCharacter: (id: string | null) => void;
  togglePause: () => void;

  // Getters
  getPlayer: () => Character | undefined;
  getCharacter: (id: string) => Character | undefined;
  getRelationship: (charAId: string, charBId: string) => Relationship | undefined;
  getRelationshipsFor: (characterId: string) => Relationship[];
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  engine: null,
  state: null,
  selectedCharacterId: null,
  isPaused: false,

  initializeSimulation: (config = {}) => {
    const engine = new SimulationEngine({
      populationSize: config.populationSize ?? 50,
    });
    engine.initializePopulation();
    set({
      engine,
      state: engine.getState() as SimulationState,
    });
  },

  createPlayer: (name, attributes, strategy) => {
    const { engine } = get();
    if (!engine) return;

    engine.createPlayer(name, attributes, strategy);
    set({ state: engine.getState() as SimulationState });
  },

  startSimulation: () => {
    const { engine } = get();
    if (!engine) return;

    engine.start();
    set({ state: engine.getState() as SimulationState });
  },

  executeActions: (actions) => {
    const { engine } = get();
    if (!engine) return;

    engine.executePlayerActions(actions);
    set({ state: engine.getState() as SimulationState });
  },

  advanceTurn: () => {
    const { engine, state } = get();
    if (!engine || !state) return;
    if (state.phase !== 'player_turn') return;

    // Skip player turn with no actions
    engine.executePlayerActions([{ type: 'skip' }]);
    set({ state: engine.getState() as SimulationState });
  },

  selectCharacter: (id) => {
    set({ selectedCharacterId: id });
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }));
  },

  getPlayer: () => {
    const { engine } = get();
    return engine?.getPlayer();
  },

  getCharacter: (id) => {
    const { engine } = get();
    return engine?.getCharacter(id);
  },

  getRelationship: (charAId, charBId) => {
    const { engine } = get();
    return engine?.getRelationship(charAId, charBId);
  },

  getRelationshipsFor: (characterId) => {
    const { engine } = get();
    return engine?.getRelationshipsFor(characterId) ?? [];
  },
}));
