import React from 'react';
import type { Connection, WorkflowNode } from '../types';

interface ConnectionLineProps {
  connection: Connection;
  nodes: WorkflowNode[];
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ connection, nodes }) => {
  const sourceNode = nodes.find(n => n.id === connection.source_node);
  const targetNode = nodes.find(n => n.id === connection.target_node);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Calculate connection points
  const sourceX = sourceNode.position.x + 200; // Right side of source node
  const sourceY = sourceNode.position.y + 60; // Middle of source node
  const targetX = targetNode.position.x; // Left side of target node
  const targetY = targetNode.position.y + 60; // Middle of target node

  // Create curved path
  const midX = (sourceX + targetX) / 2;
  const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#60a5fa"
          />
        </marker>
      </defs>
      <path
        d={path}
        stroke="#60a5fa"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
        className="drop-shadow-sm"
      />
    </svg>
  );
};

export default ConnectionLine;