import type { Ref } from "react";
import { Network } from "vis";
import type { Automaton } from "./Automatons";

const MAINCOLOR = "red";
const FINAL_STATE_COLOR = "#00ff00";
const SECOND_COLOR = "black";

export default function makeVis(aut: Automaton, containerRef: any): Network {
    let nodes: any = aut.stateNames.map((name, idx) => ({ id: idx, label: name, color: { background: MAINCOLOR, border: SECOND_COLOR } }));
    let edges: any = aut.transitions
      .map((t, idx) => ({ id: idx, from: t.from, to: t.to, color: { color: MAINCOLOR }, label: t.character, arrows: "to" }))

    aut.initialStates.forEach((stateIdx, idx) => {
      const hiddenIdx = -idx - 1;
      nodes.push({ id: hiddenIdx, shape: "dot", size: 5, color: SECOND_COLOR });
      edges.push({ from: hiddenIdx, to: stateIdx, arrows: "to", length: 75 });
    });

    aut.finalStates.forEach(stateIdx => {
      nodes[stateIdx].color.background = FINAL_STATE_COLOR;
      nodes[stateIdx].color.border = SECOND_COLOR;
    });

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
        enabled: false,
        stabilization: { iterations: 1000 },
      },
      layout: { improvedLayout: true }
    };

    const network =  new Network(containerRef.current, data, options);
    network.setSelection({
      nodes: aut.highlightedStates,
      edges: aut.highlightedEdges,
    }, { highlightEdges: false });

    return network;
  }