'use client';

import { useState } from 'react';
import { useSimulationStore } from '@/lib/store';
import { CharacterAttributes, StrategyType, ALL_STRATEGIES, STRATEGY_DESCRIPTIONS } from '@/simulation';

interface CharacterCreatorProps {
  onComplete: () => void;
}

export function CharacterCreator({ onComplete }: CharacterCreatorProps) {
  const { createPlayer, initializeSimulation, startSimulation } = useSimulationStore();

  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState<CharacterAttributes>({
    wealth: 50,
    charisma: 50,
    attractiveness: 50,
    intelligence: 50,
    emotionalStability: 50,
  });
  const [strategy, setStrategy] = useState<StrategyType>('tit_for_tat');
  const [populationSize, setPopulationSize] = useState(50);

  const totalPoints = Object.values(attributes).reduce((a, b) => a + b, 0);
  const maxPoints = 300; // Allow some flexibility

  const handleAttributeChange = (attr: keyof CharacterAttributes, value: number) => {
    setAttributes((prev) => ({
      ...prev,
      [attr]: Math.max(0, Math.min(100, value)),
    }));
  };

  const handleStart = () => {
    if (!name.trim()) return;

    initializeSimulation({ populationSize });
    createPlayer(name, attributes, strategy);
    startSimulation();
    onComplete();
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-green-400 mb-6 font-mono">
        CREATE YOUR CHARACTER
      </h2>

      {/* Name */}
      <div className="mb-6">
        <label className="block text-gray-300 mb-2 font-mono">NAME</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono"
          placeholder="Enter name..."
        />
      </div>

      {/* Attributes */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-gray-300 font-mono">ATTRIBUTES</label>
          <span className={`font-mono ${totalPoints > maxPoints ? 'text-red-400' : 'text-gray-400'}`}>
            {totalPoints}/{maxPoints}
          </span>
        </div>

        {(Object.keys(attributes) as Array<keyof CharacterAttributes>).map((attr) => (
          <div key={attr} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400 font-mono uppercase">
                {attr.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-white font-mono">{attributes[attr]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={attributes[attr]}
              onChange={(e) => handleAttributeChange(attr, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Strategy */}
      <div className="mb-6">
        <label className="block text-gray-300 mb-2 font-mono">STRATEGY</label>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as StrategyType)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono"
        >
          {ALL_STRATEGIES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
        <p className="text-gray-500 text-sm mt-2 font-mono">
          {STRATEGY_DESCRIPTIONS[strategy]}
        </p>
      </div>

      {/* Population Size */}
      <div className="mb-6">
        <label className="block text-gray-300 mb-2 font-mono">POPULATION SIZE</label>
        <input
          type="range"
          min="20"
          max="200"
          value={populationSize}
          onChange={(e) => setPopulationSize(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="text-center text-white font-mono mt-1">{populationSize}</div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!name.trim() || totalPoints > maxPoints}
        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded font-mono transition-colors"
      >
        START SIMULATION
      </button>
    </div>
  );
}
