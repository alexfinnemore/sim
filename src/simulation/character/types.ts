import { StrategyType } from './strategies';

// Base attributes (0-100 scale)
export interface CharacterAttributes {
  wealth: number;
  charisma: number;
  attractiveness: number;
  intelligence: number;
  emotionalStability: number;
}

// Character state (dynamic, changes over time)
export interface CharacterState {
  happiness: number; // 0-100
  relationshipSatisfaction: number; // 0-100
  loneliness: number; // 0-100
  socialEnergy: number; // 0-100, depletes with interactions
}

// Derived metrics (calculated from attributes and relationships)
export interface DerivedMetrics {
  socialCapital: number; // Based on network size and quality
  desirabilityScore: number; // Overall attractiveness to others
}

export interface Character {
  id: string;
  name: string;
  attributes: CharacterAttributes;
  state: CharacterState;
  strategy: StrategyType;
  isPlayer: boolean;
  createdAt: number;
}

// Configuration for character generation
export interface CharacterGenerationConfig {
  attributeRange: {
    min: number;
    max: number;
  };
  strategyWeights?: Partial<Record<StrategyType, number>>;
}

// Default generation config
export const DEFAULT_GENERATION_CONFIG: CharacterGenerationConfig = {
  attributeRange: { min: 20, max: 80 },
};
