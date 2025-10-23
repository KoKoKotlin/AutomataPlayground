// src/AutomataGraph.jsx
import React, { useEffect, useRef } from "react";
import { Network } from "vis";

export default function AutomataGraph() {
  const containerRef: any = useRef(null);

  useEffect(() => {
    const nodes = [
      { id: 1, label: "q0", color: "#ffd166" },
      { id: 2, label: "q1", color: "#06d6a0" },
      { id: 3, label: "q2", color: "#118ab2" },
    ];

    const edges = [
      { from: 1, to: 2, label: "a", arrows: "to" },
      { from: 2, to: 3, label: "b", arrows: "to" },
      { from: 3, to: 1, label: "c", arrows: "to" },
      { from: 1, to: 1, label: "ε", arrows: "to" },
    ];

    const data = { nodes, edges };

    const options: any = {
      nodes: {
        shape: "circle",
        font: { color: "#000", size: 18 },
        borderWidth: 2,
      },
      edges: {
        smooth: { type: "curvedCW", roundness: 0.2 },
        font: { align: "top" },
        arrows: { to: { enabled: true, scaleFactor: 1.2 } },
      },
      physics: {
        enabled: true,
        stabilization: true,
      },
    };

    const network = new Network(containerRef.current, data, options);

    return () => network.destroy();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "500px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    />
  );
}