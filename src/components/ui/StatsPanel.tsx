'use client';

import { useSimulationStore } from '@/lib/store';
import { STRATEGY_DESCRIPTIONS } from '@/simulation';

export function StatsPanel() {
  const { state, selectedCharacterId, getCharacter, getRelationshipsFor, getPlayer } = useSimulationStore();

  if (!state) return null;

  const player = getPlayer();
  const selectedChar = selectedCharacterId ? getCharacter(selectedCharacterId) : player;

  if (!selectedChar) {
    return (
      <div className="bg-gray-900 p-4 rounded-lg font-mono">
        <p className="text-gray-500">Select a character to view details</p>
      </div>
    );
  }

  const relationships = getRelationshipsFor(selectedChar.id);
  const positiveRels = relationships.filter((r) => r.strength > 0 && r.type !== 'none');
  const negativeRels = relationships.filter((r) => r.strength < 0);

  return (
    <div className="bg-gray-900 p-4 rounded-lg font-mono space-y-4">
      {/* Character Info */}
      <div>
        <h3 className="text-green-400 text-lg mb-2">
          {selectedChar.name}
          {selectedChar.isPlayer && <span className="text-yellow-400 ml-2">(YOU)</span>}
        </h3>
        <div className="text-gray-400 text-sm">
          Strategy: <span className="text-white uppercase">{selectedChar.strategy.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Attributes */}
      <div>
        <h4 className="text-gray-500 text-sm mb-2">ATTRIBUTES</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(selectedChar.attributes).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-400 uppercase">{key.slice(0, 3)}</span>
              <StatBar value={value} />
            </div>
          ))}
        </div>
      </div>

      {/* State */}
      <div>
        <h4 className="text-gray-500 text-sm mb-2">STATE</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Happiness</span>
            <StatBar value={selectedChar.state.happiness} color="green" />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Satisfaction</span>
            <StatBar value={selectedChar.state.relationshipSatisfaction} color="blue" />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Loneliness</span>
            <StatBar value={selectedChar.state.loneliness} color="red" />
          </div>
        </div>
      </div>

      {/* Relationships Summary */}
      <div>
        <h4 className="text-gray-500 text-sm mb-2">RELATIONSHIPS</h4>
        <div className="text-sm space-y-1">
          <div className="text-green-400">
            Positive: {positiveRels.length}
          </div>
          <div className="text-red-400">
            Negative: {negativeRels.length}
          </div>
        </div>

        {/* Top relationships */}
        {positiveRels.length > 0 && (
          <div className="mt-2">
            <div className="text-gray-500 text-xs mb-1">STRONGEST</div>
            {positiveRels
              .sort((a, b) => b.strength - a.strength)
              .slice(0, 3)
              .map((rel) => {
                const otherId = rel.characterAId === selectedChar.id ? rel.characterBId : rel.characterAId;
                const other = getCharacter(otherId);
                return (
                  <div key={rel.id} className="text-xs flex justify-between">
                    <span className="text-gray-300">{other?.name ?? 'Unknown'}</span>
                    <span className="text-green-400">{rel.type.replace('_', ' ')}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBar({ value, color = 'gray' }: { value: number; color?: string }) {
  const colorClass = {
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  }[color];

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-700 rounded overflow-hidden">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-white w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}
