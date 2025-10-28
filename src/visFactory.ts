import type { Ref } from "react";
import { Network } from "vis";
import type { Automaton } from "./Automatons";

const MAINCOLOR = "red";
const FINAL_STATE_COLOR = "#00ff00";
const SECOND_COLOR = "black";

export default function makeVis(aut: Automaton, containerRef: any, disableDebugNames: boolean): Network {
    console.log(aut);
    let nodes: any = aut.stateNames.map((name, idx) => 
      ({ id: idx, label: (disableDebugNames) ? idx.toString() : name, color: { background: MAINCOLOR, border: SECOND_COLOR } }));
    let edges: any = aut.transitions
      .map((t, idx) => ({ id: idx, from: t.from, to: t.to, color: { color: MAINCOLOR }, label: t.character, arrows: "to" }))

    let fromToMap = new Map<string, number>();
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const key = [edge.from, edge.to].join(",");
      const count = fromToMap.get(key) || 0;
      if (edge.from == edge.to) {
        edges[i]["selfReferenceSize"] = 15 + count * 7;
      } else {
        edges[i]["smooth"] = { enabled: true, type: "curvedCCW", roundness: 0.2 + count * 0.15 };
      }
      fromToMap.set(key, count + 1);
    }
    console.log(edges);

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
        smooth: { type: "curvedCCW", roundness: 0.2 },
        font: { align: "top" },
        arrows: { to: { enabled: true, scaleFactor: 1.2 } },
        selfReferenceSize: 40,
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