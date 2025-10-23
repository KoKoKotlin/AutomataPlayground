import type { Ref } from "react";
import { Network } from "vis";
import type { Automaton } from "./Automatons";

export default function makeVis(aut: Automaton, containerRef: any): Network {
    let nodes: any = aut.stateNames.map((name, idx) => ({ id: idx, label: name, color: "red" }));
    let edges: any = Array.from(aut.transitions.entries())
        .map(entry => ({ from: entry[0].stateIdx, to: entry[1], label: entry[0].character, arrows: "to" })); 

    aut.initialStates.forEach((stateIdx, idx) => {
      const hiddenIdx = -idx - 1;
      nodes.push({ id: hiddenIdx, shape: "dot", size: 5, color: "black" });
      edges.push({ from: hiddenIdx, to: stateIdx, arrows: "to", length: 75 });
    });

    console.log(nodes, edges);

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

    return new Network(containerRef.current, data, options);
}