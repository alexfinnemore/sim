'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js';
import { useSimulationStore } from '@/lib/store';
import { Character, Relationship } from '@/simulation';

// Position characters in a force-directed layout (simplified)
interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function SimulationCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());

  const { state, engine, selectedCharacterId, selectCharacter } = useSimulationStore();

  // Initialize Pixi application
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new Application();

    app.init({
      width: 800,
      height: 600,
      backgroundColor: 0x1a1a2e,
      antialias: false, // Pixel art style
      resolution: 1,
    }).then(() => {
      if (canvasRef.current && app.canvas) {
        canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
        appRef.current = app;
      }
    });

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, []);

  // Initialize positions when characters change
  useEffect(() => {
    if (!state?.characters) return;

    const newPositions = new Map<string, NodePosition>();
    const width = 800;
    const height = 600;

    state.characters.forEach((char, index) => {
      const existing = positions.get(char.id);
      if (existing) {
        newPositions.set(char.id, existing);
      } else {
        // Arrange in a circle initially
        const angle = (index / state.characters.length) * Math.PI * 2;
        const radius = Math.min(width, height) * 0.35;
        newPositions.set(char.id, {
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        });
      }
    });

    setPositions(newPositions);
  }, [state?.characters.length]);

  // Render the graph
  useEffect(() => {
    if (!appRef.current || !state || positions.size === 0) return;

    const app = appRef.current;
    const stage = app.stage;

    // Clear previous content
    stage.removeChildren();

    // Create containers
    const edgeContainer = new Container();
    const nodeContainer = new Container();
    stage.addChild(edgeContainer);
    stage.addChild(nodeContainer);

    // Draw edges (relationships)
    if (engine) {
      const relationships = engine.getGraph().getAllRelationships();

      for (const rel of relationships) {
        if (rel.type === 'none') continue;

        const posA = positions.get(rel.characterAId);
        const posB = positions.get(rel.characterBId);
        if (!posA || !posB) continue;

        const edge = new Graphics();
        const color = getEdgeColor(rel);
        const alpha = Math.min(1, Math.abs(rel.strength) / 50);

        edge.moveTo(posA.x, posA.y);
        edge.lineTo(posB.x, posB.y);
        edge.stroke({ width: Math.max(1, Math.abs(rel.strength) / 20), color, alpha });

        edgeContainer.addChild(edge);
      }
    }

    // Draw nodes (characters)
    for (const char of state.characters) {
      const pos = positions.get(char.id);
      if (!pos) continue;

      const node = new Graphics();
      const isPlayer = char.isPlayer;
      const isSelected = char.id === selectedCharacterId;

      // Node circle
      const radius = isPlayer ? 12 : 8;
      const color = isPlayer ? 0x00ff88 : getStrategyColor(char.strategy);

      if (isSelected) {
        // Selection ring
        node.circle(pos.x, pos.y, radius + 4);
        node.fill({ color: 0xffffff, alpha: 0.3 });
      }

      node.circle(pos.x, pos.y, radius);
      node.fill({ color });

      // Make interactive
      node.eventMode = 'static';
      node.cursor = 'pointer';
      node.on('pointerdown', () => selectCharacter(char.id));

      nodeContainer.addChild(node);

      // Add name label for player
      if (isPlayer || isSelected) {
        const style = new TextStyle({
          fontFamily: 'monospace',
          fontSize: 10,
          fill: 0xffffff,
        });
        const label = new Text({ text: char.name, style });
        label.x = pos.x - label.width / 2;
        label.y = pos.y + radius + 4;
        nodeContainer.addChild(label);
      }
    }
  }, [state, positions, engine, selectedCharacterId, selectCharacter]);

  return (
    <div
      ref={canvasRef}
      className="border-2 border-gray-700 rounded-lg overflow-hidden"
      style={{ width: 800, height: 600, imageRendering: 'pixelated' }}
    />
  );
}

// Get edge color based on relationship type
function getEdgeColor(rel: Relationship): number {
  switch (rel.type) {
    case 'friend':
    case 'close_friend':
      return 0x4ade80; // Green
    case 'dating':
    case 'partner':
      return 0xf472b6; // Pink
    case 'rival':
      return 0xfbbf24; // Yellow
    case 'enemy':
      return 0xef4444; // Red
    default:
      return 0x6b7280; // Gray
  }
}

// Get node color based on strategy
function getStrategyColor(strategy: string): number {
  switch (strategy) {
    case 'cooperator':
      return 0x22c55e; // Green
    case 'defector':
      return 0xef4444; // Red
    case 'tit_for_tat':
      return 0x3b82f6; // Blue
    case 'grudger':
      return 0xa855f7; // Purple
    case 'random':
      return 0xfbbf24; // Yellow
    case 'pavlov':
      return 0x06b6d4; // Cyan
    case 'generous_tit_for_tat':
      return 0x14b8a6; // Teal
    default:
      return 0x6b7280; // Gray
  }
}
