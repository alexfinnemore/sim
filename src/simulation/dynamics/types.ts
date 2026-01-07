import { Character } from '../character';
import { Relationship } from '../graph';

// Action that a character can take
export type DynamicAction = 'cooperate' | 'defect';

// Result of resolving actions between two characters
export interface ActionOutcome {
  characterAId: string;
  characterBId: string;
  actionA: DynamicAction;
  actionB: DynamicAction;
  payoffA: number;
  payoffB: number;
  relationshipImpact: number;
}

// Context provided to dynamics for decision making
export interface DynamicContext {
  character: Character;
  target: Character;
  relationship: Relationship | undefined;
  currentTurn: number;
  allCharacters: Character[];
}

// Parameters that can be tuned for each dynamic
export interface DynamicParameters {
  [key: string]: number | boolean | string;
}

// Interface for a game theory dynamic module
export interface Dynamic {
  name: string;
  description: string;
  enabled: boolean;
  parameters: DynamicParameters;

  // Evaluate what action a character should take toward a target
  evaluate(context: DynamicContext): DynamicAction;

  // Resolve actions between two characters and return outcomes
  resolve(
    actionA: DynamicAction,
    actionB: DynamicAction,
    characterA: Character,
    characterB: Character
  ): ActionOutcome;
}

// Registry of all available dynamics
export interface DynamicsRegistry {
  dynamics: Map<string, Dynamic>;
  getEnabled(): Dynamic[];
  enable(name: string): void;
  disable(name: string): void;
  setParameter(name: string, param: string, value: number | boolean | string): void;
}
