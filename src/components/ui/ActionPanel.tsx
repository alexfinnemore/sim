'use client';

import { useState } from 'react';
import { useSimulationStore } from '@/lib/store';
import { PlayerAction, PlayerActionType } from '@/simulation';

export function ActionPanel() {
  const { state, getPlayer, getRelationshipsFor, getCharacter, executeActions } = useSimulationStore();
  const [selectedActions, setSelectedActions] = useState<PlayerAction[]>([]);

  if (!state || state.phase !== 'player_turn') return null;

  const player = getPlayer();
  if (!player) return null;

  const relationships = getRelationshipsFor(player.id);
  const maxActions = state.config.actionsPerTurn;

  const handleAddAction = (type: PlayerActionType, targetId?: string) => {
    if (selectedActions.length >= maxActions) return;

    setSelectedActions((prev) => [...prev, { type, targetId }]);
  };

  const handleRemoveAction = (index: number) => {
    setSelectedActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExecute = () => {
    if (selectedActions.length === 0) {
      executeActions([{ type: 'skip' }]);
    } else {
      executeActions(selectedActions);
    }
    setSelectedActions([]);
  };

  // Get potential targets (existing relationships + some random others)
  const existingTargets = relationships.map((r) => {
    const otherId = r.characterAId === player.id ? r.characterBId : r.characterAId;
    return { id: otherId, relationship: r };
  });

  const otherChars = state.characters
    .filter((c) => !c.isPlayer && !existingTargets.some((t) => t.id === c.id))
    .slice(0, 10);

  return (
    <div className="bg-gray-900 p-4 rounded-lg font-mono">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-green-400">ACTIONS</h3>
        <span className="text-gray-400">
          {selectedActions.length}/{maxActions}
        </span>
      </div>

      {/* Queued Actions */}
      {selectedActions.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="text-gray-500 text-sm">QUEUED:</div>
          {selectedActions.map((action, index) => {
            const target = action.targetId ? getCharacter(action.targetId) : null;
            return (
              <div
                key={index}
                className="flex justify-between items-center bg-gray-800 px-3 py-2 rounded"
              >
                <span className="text-white">
                  {action.type.toUpperCase()}{' '}
                  {target && <span className="text-gray-400">→ {target.name}</span>}
                </span>
                <button
                  onClick={() => handleRemoveAction(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Available Actions */}
      {selectedActions.length < maxActions && (
        <div className="space-y-3">
          {/* Existing Relationships */}
          {existingTargets.length > 0 && (
            <div>
              <div className="text-gray-500 text-sm mb-2">EXISTING RELATIONSHIPS:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {existingTargets.map(({ id, relationship }) => {
                  const char = getCharacter(id);
                  if (!char) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-300 flex-1">{char.name}</span>
                      <span className="text-gray-500">{relationship.type}</span>
                      <ActionButtons
                        onPursue={() => handleAddAction('pursue', id)}
                        onMaintain={() => handleAddAction('maintain', id)}
                        onDistance={() => handleAddAction('distance', id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New People */}
          <div>
            <div className="text-gray-500 text-sm mb-2">MEET NEW PEOPLE:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {otherChars.map((char) => (
                <div key={char.id} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-300 flex-1">{char.name}</span>
                  <button
                    onClick={() => handleAddAction('pursue', char.id)}
                    className="text-green-400 hover:text-green-300 px-2"
                  >
                    PURSUE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded transition-colors"
      >
        {selectedActions.length === 0 ? 'SKIP TURN' : 'EXECUTE ACTIONS'}
      </button>
    </div>
  );
}

function ActionButtons({
  onPursue,
  onMaintain,
  onDistance,
}: {
  onPursue: () => void;
  onMaintain: () => void;
  onDistance: () => void;
}) {
  return (
    <div className="flex gap-1">
      <button
        onClick={onPursue}
        className="text-green-400 hover:text-green-300 px-1"
        title="Pursue"
      >
        +
      </button>
      <button
        onClick={onMaintain}
        className="text-blue-400 hover:text-blue-300 px-1"
        title="Maintain"
      >
        =
      </button>
      <button
        onClick={onDistance}
        className="text-red-400 hover:text-red-300 px-1"
        title="Distance"
      >
        -
      </button>
    </div>
  );
}
