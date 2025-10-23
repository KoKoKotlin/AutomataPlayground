// src/AutomataGraph.jsx
import React, { useEffect, useRef } from "react";
import { Network } from "vis";
import makeVis from "./visFactory";
import type { Automaton } from "./Automatons";

export default function AutomataGraph(props: { aut: Automaton }) {
  const containerRef: any = useRef(null);

  useEffect(() => {
    const network = makeVis(props.aut, containerRef);
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