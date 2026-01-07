import { v4 as uuidv4 } from 'uuid';
import {
  Character,
  CharacterAttributes,
  CharacterState,
  CharacterGenerationConfig,
  DEFAULT_GENERATION_CONFIG,
} from './types';
import { StrategyType, randomStrategy } from './strategies';

// Random number in range (inclusive)
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random attributes within config range
function generateAttributes(config: CharacterGenerationConfig): CharacterAttributes {
  const { min, max } = config.attributeRange;
  return {
    wealth: randomInRange(min, max),
    charisma: randomInRange(min, max),
    attractiveness: randomInRange(min, max),
    intelligence: randomInRange(min, max),
    emotionalStability: randomInRange(min, max),
  };
}

// Initialize character state
function initializeState(): CharacterState {
  return {
    happiness: 50,
    relationshipSatisfaction: 50,
    loneliness: 50,
    socialEnergy: 100,
  };
}

// Name generator - simple for now, can be expanded
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Cameron', 'Drew', 'Sage', 'River', 'Phoenix', 'Blake', 'Charlie', 'Dakota',
  'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie', 'Kendall', 'Lane', 'Logan',
  'Marley', 'Parker', 'Peyton', 'Reese', 'Rowan', 'Skyler', 'Spencer', 'Sydney',
];

function generateName(): string {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
}

// Create a new character
export function createCharacter(
  options: {
    name?: string;
    attributes?: Partial<CharacterAttributes>;
    strategy?: StrategyType;
    isPlayer?: boolean;
  } = {},
  config: CharacterGenerationConfig = DEFAULT_GENERATION_CONFIG
): Character {
  const generatedAttributes = generateAttributes(config);
  const attributes: CharacterAttributes = {
    ...generatedAttributes,
    ...options.attributes,
  };

  return {
    id: uuidv4(),
    name: options.name ?? generateName(),
    attributes,
    state: initializeState(),
    strategy: options.strategy ?? randomStrategy(config.strategyWeights),
    isPlayer: options.isPlayer ?? false,
    createdAt: Date.now(),
  };
}

// Create the player's character
export function createPlayerCharacter(
  name: string,
  attributes: CharacterAttributes,
  strategy: StrategyType
): Character {
  return {
    id: uuidv4(),
    name,
    attributes,
    state: initializeState(),
    strategy,
    isPlayer: true,
    createdAt: Date.now(),
  };
}

// Generate a population of NPCs
export function generatePopulation(
  size: number,
  config: CharacterGenerationConfig = DEFAULT_GENERATION_CONFIG
): Character[] {
  return Array.from({ length: size }, () => createCharacter({}, config));
}

// Calculate derived metrics
export function calculateDesirability(character: Character): number {
  const { wealth, charisma, attractiveness, intelligence, emotionalStability } = character.attributes;
  // Weighted average - can be tuned
  return (
    wealth * 0.2 +
    charisma * 0.25 +
    attractiveness * 0.25 +
    intelligence * 0.15 +
    emotionalStability * 0.15
  );
}

// Calculate compatibility between two characters
export function calculateCompatibility(char1: Character, char2: Character): number {
  const attrs1 = char1.attributes;
  const attrs2 = char2.attributes;

  // Similarity-based compatibility (0-100)
  // People tend to connect with those similar to them
  const diffs = [
    Math.abs(attrs1.wealth - attrs2.wealth),
    Math.abs(attrs1.charisma - attrs2.charisma),
    Math.abs(attrs1.attractiveness - attrs2.attractiveness),
    Math.abs(attrs1.intelligence - attrs2.intelligence),
    Math.abs(attrs1.emotionalStability - attrs2.emotionalStability),
  ];

  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const similarity = 100 - avgDiff;

  // Also factor in mutual desirability
  const d1 = calculateDesirability(char1);
  const d2 = calculateDesirability(char2);
  const mutualAttraction = (d1 + d2) / 2;

  // Combined score
  return similarity * 0.6 + mutualAttraction * 0.4;
}
