// src/AutomataGraph.jsx
import React, { useEffect, useRef, type Ref } from "react";
import { Network } from "vis";
import makeVis from "./visFactory";
import type { Automaton } from "./Automatons";

export default function AutomataGraph(props: { aut: Automaton, networkRef: Ref<Network> }) {
  const containerRef: any = useRef(null);

  useEffect(() => {
    const network = makeVis(props.aut, containerRef);
    props.networkRef!.current = network;
    return () => network.destroy();
  }, [props.aut]);

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