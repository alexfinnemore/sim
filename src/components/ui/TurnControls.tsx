'use client';

import { useSimulationStore } from '@/lib/store';

export function TurnControls() {
  const { state, advanceTurn, isPaused, togglePause } = useSimulationStore();

  if (!state) return null;

  return (
    <div className="bg-gray-900 p-4 rounded-lg font-mono">
      <div className="flex items-center justify-between mb-4">
        <div className="text-green-400">
          TURN: <span className="text-white">{state.turn}</span>
        </div>
        <div className="text-gray-400">
          PHASE: <span className="text-white uppercase">{state.phase.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={advanceTurn}
          disabled={state.phase !== 'player_turn'}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded transition-colors"
        >
          NEXT TURN
        </button>
        <button
          onClick={togglePause}
          className={`px-4 py-2 rounded transition-colors ${
            isPaused ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'
          }`}
        >
          {isPaused ? 'PLAY' : 'PAUSE'}
        </button>
      </div>
    </div>
  );
}
