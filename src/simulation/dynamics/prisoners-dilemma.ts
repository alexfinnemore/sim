import { Dynamic, DynamicAction, DynamicContext, ActionOutcome, DynamicParameters } from './types';
import { executeStrategy, InteractionHistory, StrategyContext } from '../character';
import { Relationship } from '../graph';

// Classic Prisoner's Dilemma payoff matrix
// Default values can be tuned
const DEFAULT_PAYOFFS = {
  // (My action, Their action) => My payoff
  cooperate_cooperate: 3, // Mutual cooperation (reward)
  cooperate_defect: -1, // I cooperate, they defect (sucker's payoff)
  defect_cooperate: 5, // I defect, they cooperate (temptation)
  defect_defect: 0, // Mutual defection (punishment)
};

export interface PrisonersDilemmaParameters extends DynamicParameters {
  rewardCooperate: number; // Both cooperate
  suckerPayoff: number; // You cooperate, they defect
  temptation: number; // You defect, they cooperate
  punishment: number; // Both defect
  relationshipMultiplier: number; // How much payoffs affect relationship
}

export class PrisonersDilemmaDynamic implements Dynamic {
  name = 'prisoners_dilemma';
  description = 'Classic game theory: characters choose to cooperate or defect, with payoffs based on mutual choices.';
  enabled = true;
  parameters: PrisonersDilemmaParameters = {
    rewardCooperate: DEFAULT_PAYOFFS.cooperate_cooperate,
    suckerPayoff: DEFAULT_PAYOFFS.cooperate_defect,
    temptation: DEFAULT_PAYOFFS.defect_cooperate,
    punishment: DEFAULT_PAYOFFS.defect_defect,
    relationshipMultiplier: 3, // Payoffs are multiplied for relationship impact
  };

  // Convert relationship history to strategy context
  private buildStrategyContext(
    relationship: Relationship | undefined,
    targetId: string,
    currentTurn: number
  ): StrategyContext {
    if (!relationship) {
      return { history: [], currentTurn };
    }

    // Convert interaction records to strategy history format
    const history: InteractionHistory[] = relationship.history
      .filter((h) => h.type === 'cooperate' || h.type === 'defect')
      .map((h) => ({
        partnerId: targetId,
        myAction: h.type as 'cooperate' | 'defect',
        theirAction: h.type as 'cooperate' | 'defect', // Simplified - in real version track both
        turn: h.turn,
      }));

    return { history, currentTurn };
  }

  // Evaluate what action a character should take based on their strategy
  evaluate(context: DynamicContext): DynamicAction {
    const { character, target, relationship, currentTurn } = context;

    // Use character's fixed strategy
    const strategyContext = this.buildStrategyContext(
      relationship,
      target.id,
      currentTurn
    );

    return executeStrategy(character.strategy, target.id, strategyContext);
  }

  // Resolve the interaction and calculate payoffs
  resolve(
    actionA: DynamicAction,
    actionB: DynamicAction,
    characterA: { id: string },
    characterB: { id: string }
  ): ActionOutcome {
    const { rewardCooperate, suckerPayoff, temptation, punishment, relationshipMultiplier } =
      this.parameters;

    let payoffA: number;
    let payoffB: number;

    if (actionA === 'cooperate' && actionB === 'cooperate') {
      payoffA = rewardCooperate;
      payoffB = rewardCooperate;
    } else if (actionA === 'cooperate' && actionB === 'defect') {
      payoffA = suckerPayoff;
      payoffB = temptation;
    } else if (actionA === 'defect' && actionB === 'cooperate') {
      payoffA = temptation;
      payoffB = suckerPayoff;
    } else {
      // Both defect
      payoffA = punishment;
      payoffB = punishment;
    }

    // Relationship impact is based on combined payoffs
    // Mutual cooperation builds relationships, mutual defection hurts them
    const combinedPayoff = payoffA + payoffB;
    const relationshipImpact = combinedPayoff * relationshipMultiplier;

    return {
      characterAId: characterA.id,
      characterBId: characterB.id,
      actionA,
      actionB,
      payoffA,
      payoffB,
      relationshipImpact,
    };
  }
}

// Singleton instance
export const prisonersDilemma = new PrisonersDilemmaDynamic();
