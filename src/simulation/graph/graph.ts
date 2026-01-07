import { v4 as uuidv4 } from 'uuid';
import {
  Relationship,
  RelationshipType,
  RelationshipConfig,
  DEFAULT_RELATIONSHIP_CONFIG,
  RELATIONSHIP_THRESHOLDS,
  FRIENDSHIP_PROGRESSION,
  ROMANTIC_PROGRESSION,
  NEGATIVE_PROGRESSION,
  InteractionRecord,
} from './types';
import { Character } from '../character';

// Social graph - manages all relationships
export class SocialGraph {
  private relationships: Map<string, Relationship> = new Map();
  private config: RelationshipConfig;

  constructor(config: RelationshipConfig = DEFAULT_RELATIONSHIP_CONFIG) {
    this.config = config;
  }

  // Get unique edge key for two characters (order-independent)
  private getEdgeKey(charAId: string, charBId: string): string {
    return [charAId, charBId].sort().join('::');
  }

  // Get relationship between two characters
  getRelationship(charAId: string, charBId: string): Relationship | undefined {
    const key = this.getEdgeKey(charAId, charBId);
    return this.relationships.get(key);
  }

  // Get all relationships for a character
  getRelationshipsFor(characterId: string): Relationship[] {
    return Array.from(this.relationships.values()).filter(
      (r) => r.characterAId === characterId || r.characterBId === characterId
    );
  }

  // Get neighbors (characters with relationships)
  getNeighbors(characterId: string): string[] {
    const relationships = this.getRelationshipsFor(characterId);
    return relationships.map((r) =>
      r.characterAId === characterId ? r.characterBId : r.characterAId
    );
  }

  // Create or get relationship
  getOrCreateRelationship(charAId: string, charBId: string): Relationship {
    const existing = this.getRelationship(charAId, charBId);
    if (existing) return existing;

    const key = this.getEdgeKey(charAId, charBId);
    const [sortedA, sortedB] = [charAId, charBId].sort();

    const relationship: Relationship = {
      id: uuidv4(),
      characterAId: sortedA,
      characterBId: sortedB,
      type: 'none',
      strength: 0,
      trust: 50, // Start neutral
      investment: 0,
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.relationships.set(key, relationship);
    return relationship;
  }

  // Update relationship after an interaction
  updateRelationship(
    charAId: string,
    charBId: string,
    interaction: InteractionRecord
  ): Relationship {
    const relationship = this.getOrCreateRelationship(charAId, charBId);
    const key = this.getEdgeKey(charAId, charBId);

    // Update strength based on interaction outcome
    relationship.strength = Math.max(
      this.config.minStrength,
      Math.min(this.config.maxStrength, relationship.strength + interaction.outcome)
    );

    // Update trust based on cooperation/defection
    if (interaction.type === 'cooperate') {
      relationship.trust = Math.min(100, relationship.trust + 5);
    } else if (interaction.type === 'defect') {
      relationship.trust = Math.max(0, relationship.trust - 15);
    }

    // Update investment
    if (['cooperate', 'pursue', 'maintain'].includes(interaction.type)) {
      relationship.investment += 1;
    }

    // Add to history
    relationship.history.push(interaction);
    relationship.updatedAt = Date.now();

    // Determine new relationship type based on strength
    relationship.type = this.determineRelationshipType(relationship);

    this.relationships.set(key, relationship);
    return relationship;
  }

  // Determine relationship type based on current state
  private determineRelationshipType(relationship: Relationship): RelationshipType {
    const { strength, trust } = relationship;

    // Negative relationships
    if (strength <= RELATIONSHIP_THRESHOLDS.enemy) {
      return 'enemy';
    }
    if (strength <= RELATIONSHIP_THRESHOLDS.rival) {
      return 'rival';
    }

    // Positive relationships - check progression
    // For now, default to friendship track (romantic requires mutual intent)
    if (strength >= RELATIONSHIP_THRESHOLDS.close_friend && trust >= 70) {
      return 'close_friend';
    }
    if (strength >= RELATIONSHIP_THRESHOLDS.friend && trust >= 40) {
      return 'friend';
    }
    if (strength >= RELATIONSHIP_THRESHOLDS.acquaintance) {
      return 'acquaintance';
    }

    return 'none';
  }

  // Apply decay to all relationships (called each turn)
  applyDecay(currentTurn: number): void {
    for (const [key, relationship] of this.relationships) {
      // Skip if interaction happened this turn
      const hadRecentInteraction = relationship.history.some(
        (h) => h.turn === currentTurn
      );
      if (hadRecentInteraction) continue;

      // Decay strength
      if (relationship.strength > 0) {
        relationship.strength = Math.max(
          0,
          relationship.strength - this.config.decayRate
        );
      } else if (relationship.strength < 0) {
        // Negative relationships slowly recover
        relationship.strength = Math.min(
          0,
          relationship.strength + this.config.decayRate * 0.5
        );
      }

      // Trust slowly recovers
      if (relationship.trust < 50) {
        relationship.trust = Math.min(
          50,
          relationship.trust + this.config.trustRecoveryRate * 0.1
        );
      }

      // Update type
      relationship.type = this.determineRelationshipType(relationship);
      relationship.updatedAt = Date.now();
      this.relationships.set(key, relationship);
    }
  }

  // Get all relationships
  getAllRelationships(): Relationship[] {
    return Array.from(this.relationships.values());
  }

  // Get relationship count by type
  getRelationshipCounts(characterId: string): Record<RelationshipType, number> {
    const relationships = this.getRelationshipsFor(characterId);
    const counts: Record<RelationshipType, number> = {
      none: 0,
      acquaintance: 0,
      friend: 0,
      close_friend: 0,
      dating: 0,
      partner: 0,
      rival: 0,
      enemy: 0,
    };

    for (const rel of relationships) {
      counts[rel.type]++;
    }

    return counts;
  }

  // Serialize for storage
  toJSON(): { relationships: Relationship[] } {
    return {
      relationships: this.getAllRelationships(),
    };
  }

  // Load from serialized data
  static fromJSON(
    data: { relationships: Relationship[] },
    config?: RelationshipConfig
  ): SocialGraph {
    const graph = new SocialGraph(config);
    for (const rel of data.relationships) {
      const key = graph.getEdgeKey(rel.characterAId, rel.characterBId);
      graph.relationships.set(key, rel);
    }
    return graph;
  }
}
