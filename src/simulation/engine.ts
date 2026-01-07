import { v4 as uuidv4 } from 'uuid';
import {
  Character,
  createCharacter,
  createPlayerCharacter,
  generatePopulation,
  CharacterAttributes,
  StrategyType,
} from './character';
import { SocialGraph, Relationship, InteractionRecord } from './graph';
import { DynamicsRegistry, createDynamicsRegistry, ActionOutcome } from './dynamics';
import {
  SimulationState,
  SimulationConfig,
  SimulationEvent,
  PlayerAction,
  DEFAULT_SIMULATION_CONFIG,
} from './types';

export class SimulationEngine {
  private state: SimulationState;
  private graph: SocialGraph;
  private registry: DynamicsRegistry;

  constructor(config: Partial<SimulationConfig> = {}) {
    const fullConfig = { ...DEFAULT_SIMULATION_CONFIG, ...config };

    this.graph = new SocialGraph();
    this.registry = createDynamicsRegistry();

    // Apply config to registry
    for (const dynamicName of fullConfig.enabledDynamics) {
      this.registry.enable(dynamicName);
    }
    for (const [dynamicName, params] of Object.entries(fullConfig.parameters)) {
      for (const [param, value] of Object.entries(params)) {
        this.registry.setParameter(dynamicName, param, value);
      }
    }

    // Initialize state
    this.state = {
      id: uuidv4(),
      turn: 0,
      characters: [],
      playerCharacterId: null,
      events: [],
      config: fullConfig,
      phase: 'setup',
    };
  }

  // Initialize population (call after creating player character)
  initializePopulation(): void {
    const npcs = generatePopulation(this.state.config.populationSize);
    this.state.characters.push(...npcs);
    this.addEvent('simulation_start', 'Simulation initialized', []);
  }

  // Create the player's character
  createPlayer(
    name: string,
    attributes: CharacterAttributes,
    strategy: StrategyType
  ): Character {
    const player = createPlayerCharacter(name, attributes, strategy);
    this.state.characters.push(player);
    this.state.playerCharacterId = player.id;
    this.addEvent('player_created', `Player "${name}" joined the simulation`, [player.id]);
    return player;
  }

  // Get current state (read-only view)
  getState(): Readonly<SimulationState> {
    return this.state;
  }

  // Get the player character
  getPlayer(): Character | undefined {
    if (!this.state.playerCharacterId) return undefined;
    return this.state.characters.find((c) => c.id === this.state.playerCharacterId);
  }

  // Get character by ID
  getCharacter(id: string): Character | undefined {
    return this.state.characters.find((c) => c.id === id);
  }

  // Get relationship between characters
  getRelationship(charAId: string, charBId: string): Relationship | undefined {
    return this.graph.getRelationship(charAId, charBId);
  }

  // Get all relationships for a character
  getRelationshipsFor(characterId: string): Relationship[] {
    return this.graph.getRelationshipsFor(characterId);
  }

  // Get graph for visualization
  getGraph(): SocialGraph {
    return this.graph;
  }

  // Start the simulation
  start(): void {
    if (this.state.phase !== 'setup') {
      throw new Error('Simulation already started');
    }
    if (!this.state.playerCharacterId) {
      throw new Error('Player character not created');
    }
    if (this.state.characters.length < 2) {
      throw new Error('Need at least 2 characters');
    }

    this.state.turn = 1;
    this.state.phase = 'player_turn';
    this.addEvent('turn_start', `Turn ${this.state.turn} begins`, []);
  }

  // Execute player actions
  executePlayerActions(actions: PlayerAction[]): void {
    if (this.state.phase !== 'player_turn') {
      throw new Error('Not player turn');
    }

    const player = this.getPlayer();
    if (!player) throw new Error('No player');

    const maxActions = this.state.config.actionsPerTurn;
    const validActions = actions.slice(0, maxActions);

    for (const action of validActions) {
      this.executePlayerAction(player, action);
    }

    // Move to NPC turn
    this.state.phase = 'npc_turn';
    this.executeNPCTurn();
  }

  // Execute a single player action
  private executePlayerAction(player: Character, action: PlayerAction): void {
    if (action.type === 'skip' || !action.targetId) return;

    const target = this.getCharacter(action.targetId);
    if (!target) return;

    // Create interaction based on action type
    const interaction: InteractionRecord = {
      turn: this.state.turn,
      type: action.type === 'pursue' || action.type === 'maintain' ? 'cooperate' : 'defect',
      outcome: this.getActionOutcome(action.type),
    };

    this.graph.updateRelationship(player.id, target.id, interaction);

    this.addEvent(
      `player_action_${action.type}`,
      `${player.name} ${action.type}s relationship with ${target.name}`,
      [player.id, target.id]
    );
  }

  // Get outcome value for player action types
  private getActionOutcome(type: string): number {
    switch (type) {
      case 'pursue':
        return 8;
      case 'maintain':
        return 5;
      case 'distance':
        return -3;
      case 'end':
        return -10;
      default:
        return 0;
    }
  }

  // Execute NPC turns using game theory dynamics
  private executeNPCTurn(): void {
    const npcs = this.state.characters.filter((c) => !c.isPlayer);
    const enabledDynamics = this.registry.getEnabled();

    if (enabledDynamics.length === 0) {
      this.state.phase = 'resolution';
      this.resolveTurn();
      return;
    }

    // Each NPC interacts with a subset of other characters
    for (const npc of npcs) {
      // Get neighbors or random characters to interact with
      const potentialTargets = this.getPotentialInteractions(npc);

      for (const target of potentialTargets) {
        // Use first enabled dynamic for now
        const dynamic = enabledDynamics[0];

        const contextA = {
          character: npc,
          target,
          relationship: this.graph.getRelationship(npc.id, target.id),
          currentTurn: this.state.turn,
          allCharacters: this.state.characters,
        };

        const contextB = {
          character: target,
          target: npc,
          relationship: this.graph.getRelationship(target.id, npc.id),
          currentTurn: this.state.turn,
          allCharacters: this.state.characters,
        };

        // Get actions from both characters
        const actionA = dynamic.evaluate(contextA);
        const actionB = dynamic.evaluate(contextB);

        // Resolve interaction
        const outcome = dynamic.resolve(actionA, actionB, npc, target);

        // Update relationship
        const interactionA: InteractionRecord = {
          turn: this.state.turn,
          type: actionA,
          outcome: outcome.payoffA,
        };
        const interactionB: InteractionRecord = {
          turn: this.state.turn,
          type: actionB,
          outcome: outcome.payoffB,
        };

        this.graph.updateRelationship(npc.id, target.id, interactionA);

        // Update character happiness based on payoff
        npc.state.happiness = Math.max(0, Math.min(100, npc.state.happiness + outcome.payoffA));
        target.state.happiness = Math.max(0, Math.min(100, target.state.happiness + outcome.payoffB));
      }
    }

    this.state.phase = 'resolution';
    this.resolveTurn();
  }

  // Get characters that an NPC might interact with
  private getPotentialInteractions(character: Character): Character[] {
    // Get existing neighbors
    const neighborIds = this.graph.getNeighbors(character.id);
    const neighbors = neighborIds
      .map((id) => this.getCharacter(id))
      .filter((c): c is Character => c !== undefined && c.id !== character.id);

    // Also potentially meet new people (random)
    const others = this.state.characters.filter(
      (c) => c.id !== character.id && !neighborIds.includes(c.id)
    );

    // 30% chance to interact with a random new person
    const newConnections: Character[] = [];
    if (others.length > 0 && Math.random() < 0.3) {
      const randomOther = others[Math.floor(Math.random() * others.length)];
      newConnections.push(randomOther);
    }

    // Interact with subset of neighbors + any new connections
    const maxInteractions = 3;
    const shuffledNeighbors = neighbors.sort(() => Math.random() - 0.5);

    return [...newConnections, ...shuffledNeighbors].slice(0, maxInteractions);
  }

  // Resolve end of turn
  private resolveTurn(): void {
    // Apply relationship decay
    this.graph.applyDecay(this.state.turn);

    // Update character states
    for (const character of this.state.characters) {
      this.updateCharacterState(character);
    }

    // Check for significant events
    this.checkForEvents();

    // Advance to next turn
    this.state.turn++;
    this.state.phase = 'player_turn';

    this.addEvent('turn_end', `Turn ${this.state.turn - 1} ended`, []);
  }

  // Update a character's state based on their relationships
  private updateCharacterState(character: Character): void {
    const relationships = this.graph.getRelationshipsFor(character.id);

    // Calculate relationship satisfaction
    const positiveRels = relationships.filter((r) => r.strength > 0);
    const avgStrength = positiveRels.length > 0
      ? positiveRels.reduce((sum, r) => sum + r.strength, 0) / positiveRels.length
      : 0;
    character.state.relationshipSatisfaction = avgStrength;

    // Calculate loneliness (inverse of connection count)
    const connectionCount = relationships.filter((r) => r.type !== 'none').length;
    character.state.loneliness = Math.max(0, 100 - connectionCount * 10);

    // Recover social energy
    character.state.socialEnergy = Math.min(100, character.state.socialEnergy + 10);
  }

  // Check for significant events to report
  private checkForEvents(): void {
    // Check for new friendships, breakups, etc.
    const relationships = this.graph.getAllRelationships();

    for (const rel of relationships) {
      // Check recent history for transitions
      const recentHistory = rel.history.filter((h) => h.turn === this.state.turn);
      if (recentHistory.length === 0) continue;

      // Significant changes could trigger events
      if (rel.type === 'friend' && rel.strength >= 25 && rel.strength < 35) {
        const charA = this.getCharacter(rel.characterAId);
        const charB = this.getCharacter(rel.characterBId);
        if (charA && charB) {
          this.addEvent(
            'new_friendship',
            `${charA.name} and ${charB.name} became friends`,
            [rel.characterAId, rel.characterBId]
          );
        }
      }
    }
  }

  // Add event to history
  private addEvent(
    type: string,
    description: string,
    characterIds: string[],
    data?: Record<string, unknown>
  ): void {
    this.state.events.push({
      turn: this.state.turn,
      type,
      description,
      characterIds,
      data,
    });
  }

  // Serialize state for storage
  toJSON(): { state: SimulationState; graph: ReturnType<SocialGraph['toJSON']> } {
    return {
      state: this.state,
      graph: this.graph.toJSON(),
    };
  }

  // Load from serialized state
  static fromJSON(data: {
    state: SimulationState;
    graph: ReturnType<SocialGraph['toJSON']>;
  }): SimulationEngine {
    const engine = new SimulationEngine(data.state.config);
    engine.state = data.state;
    engine.graph = SocialGraph.fromJSON(data.graph);
    return engine;
  }
}
