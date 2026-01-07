import { Dynamic, DynamicsRegistry } from './types';
import { prisonersDilemma } from './prisoners-dilemma';

// Create and manage the dynamics registry
export function createDynamicsRegistry(): DynamicsRegistry {
  const dynamics = new Map<string, Dynamic>();

  // Register default dynamics
  dynamics.set(prisonersDilemma.name, prisonersDilemma);

  return {
    dynamics,

    getEnabled(): Dynamic[] {
      return Array.from(dynamics.values()).filter((d) => d.enabled);
    },

    enable(name: string): void {
      const dynamic = dynamics.get(name);
      if (dynamic) {
        dynamic.enabled = true;
      }
    },

    disable(name: string): void {
      const dynamic = dynamics.get(name);
      if (dynamic) {
        dynamic.enabled = false;
      }
    },

    setParameter(
      name: string,
      param: string,
      value: number | boolean | string
    ): void {
      const dynamic = dynamics.get(name);
      if (dynamic && param in dynamic.parameters) {
        dynamic.parameters[param] = value;
      }
    },
  };
}

// Default registry instance
export const defaultRegistry = createDynamicsRegistry();
