// Relationship types - can progress through stages
export type RelationshipType =
  | 'none'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'dating'
  | 'partner'
  | 'rival'
  | 'enemy';

// Relationship stage progressions
export const FRIENDSHIP_PROGRESSION: RelationshipType[] = [
  'none',
  'acquaintance',
  'friend',
  'close_friend',
];

export const ROMANTIC_PROGRESSION: RelationshipType[] = [
  'none',
  'acquaintance',
  'dating',
  'partner',
];

export const NEGATIVE_PROGRESSION: RelationshipType[] = [
  'none',
  'rival',
  'enemy',
];

// Interaction record for history
export interface InteractionRecord {
  turn: number;
  type: 'cooperate' | 'defect' | 'pursue' | 'maintain' | 'distance' | 'end';
  outcome: number; // Positive or negative impact
}

// Edge in the social graph (relationship between two characters)
export interface Relationship {
  id: string;
  characterAId: string;
  characterBId: string;
  type: RelationshipType;
  strength: number; // 0-100, how strong the relationship is
  trust: number; // 0-100, based on cooperation history
  investment: number; // Accumulated time/energy invested
  history: InteractionRecord[];
  createdAt: number;
  updatedAt: number;
}

// Thresholds for relationship transitions
export const RELATIONSHIP_THRESHOLDS = {
  acquaintance: 10, // strength needed to become acquaintance
  friend: 30, // strength needed to become friend
  close_friend: 60, // strength needed to become close friend
  dating: 40, // strength + mutual romantic interest
  partner: 70, // strength needed for partnership
  rival: -20, // negative strength threshold
  enemy: -50, // serious negative relationship
};

// Configuration for relationship dynamics
export interface RelationshipConfig {
  decayRate: number; // How fast relationships decay without interaction
  maxStrength: number;
  minStrength: number;
  trustRecoveryRate: number; // How fast trust recovers after betrayal
}

export const DEFAULT_RELATIONSHIP_CONFIG: RelationshipConfig = {
  decayRate: 1,
  maxStrength: 100,
  minStrength: -100,
  trustRecoveryRate: 2,
};
