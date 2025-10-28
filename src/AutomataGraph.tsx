// src/AutomataGraph.jsx
import React, { useEffect, useRef, type RefObject } from "react";
import { Network } from "vis";
import makeVis from "./visFactory";
import type { Automaton } from "./Automatons";
import type { AppState } from "./App";

export default function AutomataGraph(props: { state: AppState, networkRef: RefObject<Network | null> }) {
  const containerRef: any = useRef(null);

  useEffect(() => {
    const network = makeVis(props.state.aut, containerRef, props.state.disableDebugNames);
    props.networkRef.current = network;
    return () => network.destroy();
  }, [props.state.aut, props.state.disableDebugNames]);

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