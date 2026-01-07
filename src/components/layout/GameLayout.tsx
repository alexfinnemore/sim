'use client';

import { useState } from 'react';
import { useSimulationStore } from '@/lib/store';
import { SimulationCanvas } from '../simulation/SimulationCanvas';
import { CharacterCreator } from '../ui/CharacterCreator';
import { TurnControls } from '../ui/TurnControls';
import { StatsPanel } from '../ui/StatsPanel';
import { ActionPanel } from '../ui/ActionPanel';

export function GameLayout() {
  const { state } = useSimulationStore();
  const [gameStarted, setGameStarted] = useState(false);

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div>
          <h1 className="text-4xl font-bold text-green-400 text-center mb-8 font-mono">
            RELATIONSHIP SIMULATOR
          </h1>
          <CharacterCreator onComplete={() => setGameStarted(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-green-400 font-mono">
            RELATIONSHIP SIMULATOR
          </h1>
          <div className="text-gray-400 font-mono">
            Population: {state?.characters.length ?? 0}
          </div>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <TurnControls />
            <StatsPanel />
          </div>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <SimulationCanvas />
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1">
            <ActionPanel />
          </div>
        </div>

        {/* Events log */}
        {state && state.events.length > 0 && (
          <div className="mt-4 bg-gray-900 p-4 rounded-lg font-mono">
            <h3 className="text-gray-500 text-sm mb-2">RECENT EVENTS</h3>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {state.events
                .slice(-5)
                .reverse()
                .map((event, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-gray-500">[T{event.turn}]</span>{' '}
                    <span className="text-gray-300">{event.description}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
