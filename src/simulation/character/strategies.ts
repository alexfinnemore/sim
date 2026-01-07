// Fixed strategies for character behavior in interactions
// Based on classic game theory strategies

export type StrategyType =
  | 'cooperator' // Always cooperates
  | 'defector' // Always defects
  | 'tit_for_tat' // Copies opponent's last move
  | 'grudger' // Cooperates until betrayed, then always defects
  | 'random' // Random choice each time
  | 'pavlov' // Win-stay, lose-shift
  | 'generous_tit_for_tat'; // Tit-for-tat but occasionally forgives

export interface InteractionHistory {
  partnerId: string;
  myAction: 'cooperate' | 'defect';
  theirAction: 'cooperate' | 'defect';
  turn: number;
}

export interface StrategyContext {
  history: InteractionHistory[];
  currentTurn: number;
}

export type StrategyDecision = 'cooperate' | 'defect';

// Strategy implementations
export function executeStrategy(
  strategy: StrategyType,
  partnerId: string,
  context: StrategyContext
): StrategyDecision {
  const partnerHistory = context.history.filter((h) => h.partnerId === partnerId);
  const lastInteraction = partnerHistory[partnerHistory.length - 1];

  switch (strategy) {
    case 'cooperator':
      return 'cooperate';

    case 'defector':
      return 'defect';

    case 'tit_for_tat':
      // First interaction: cooperate. Then copy their last move.
      if (!lastInteraction) return 'cooperate';
      return lastInteraction.theirAction;

    case 'grudger':
      // If they ever defected, always defect
      const wasBetrayed = partnerHistory.some((h) => h.theirAction === 'defect');
      return wasBetrayed ? 'defect' : 'cooperate';

    case 'random':
      return Math.random() < 0.5 ? 'cooperate' : 'defect';

    case 'pavlov':
      // Win-stay, lose-shift
      // Win = both cooperate or I defect and they cooperate
      // Lose = I cooperate and they defect, or both defect
      if (!lastInteraction) return 'cooperate';
      const wasWin =
        (lastInteraction.myAction === 'cooperate' && lastInteraction.theirAction === 'cooperate') ||
        (lastInteraction.myAction === 'defect' && lastInteraction.theirAction === 'cooperate');
      return wasWin ? lastInteraction.myAction : lastInteraction.myAction === 'cooperate' ? 'defect' : 'cooperate';

    case 'generous_tit_for_tat':
      // Like tit-for-tat but 10% chance to forgive a defection
      if (!lastInteraction) return 'cooperate';
      if (lastInteraction.theirAction === 'defect' && Math.random() < 0.1) {
        return 'cooperate'; // Forgive
      }
      return lastInteraction.theirAction;

    default:
      return 'cooperate';
  }
}

// Strategy descriptions for UI
export const STRATEGY_DESCRIPTIONS: Record<StrategyType, string> = {
  cooperator: 'Always cooperates with others, building trust but vulnerable to exploitation.',
  defector: 'Always defects, maximizing short-term gain at the cost of relationships.',
  tit_for_tat: 'Starts friendly, then mirrors the other\'s behavior. Fair but can get stuck in feuds.',
  grudger: 'Cooperates until betrayed, then never forgives. Long memory, holds grudges.',
  random: 'Unpredictable behavior. Sometimes helpful, sometimes harmful.',
  pavlov: 'Sticks with what works, changes when it doesn\'t. Adaptive but simple.',
  generous_tit_for_tat: 'Like tit-for-tat but occasionally forgives, breaking cycles of retaliation.',
};

// All available strategies
export const ALL_STRATEGIES: StrategyType[] = [
  'cooperator',
  'defector',
  'tit_for_tat',
  'grudger',
  'random',
  'pavlov',
  'generous_tit_for_tat',
];

// Pick a random strategy with optional weights
export function randomStrategy(weights?: Partial<Record<StrategyType, number>>): StrategyType {
  if (!weights) {
    return ALL_STRATEGIES[Math.floor(Math.random() * ALL_STRATEGIES.length)];
  }

  const entries = ALL_STRATEGIES.map((s) => ({
    strategy: s,
    weight: weights[s] ?? 1,
  }));

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of entries) {
    random -= entry.weight;
    if (random <= 0) return entry.strategy;
  }

  return ALL_STRATEGIES[0];
}
