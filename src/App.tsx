import React, { useRef, useState, type Ref } from 'react';
import './App.css'
import AutomataGraph from './AutomataGraph';
import { Automaton, AutomatonType, EPSILON, makeAut, mt, regexToAut, type AutomatonOpts, type Transition } from './Automatons';
import type { Network } from 'vis';

/* TODO:
    - implement switching between debug and number state names
    - better color scheme
    - display if word is accepted or not after reading the last character
    - display all the states the automaton is currently in
    - display currently read character with color
    - better ui
*/

const INITIAL_JSON = `{
    "stateNames": ["q0", "q1", "E"],
    "finalStates": [1],
    "initialStates": [0],
    "alphabet": ["a", "b"],
    "transitions":  [
      {"character": "a", "from": 0, "to": 0},
      {"character": "b", "from": 0, "to": 1},
      {"character": "a", "from": 1, "to": 2},
      {"character": "b", "from": 1, "to": 1},
      {"character": "a", "from": 2, "to": 2},
      {"character": "b", "from": 2, "to": 2}
    ]
}`

function replaceEps(c: string): string {
  if (c === "EPSILON") return EPSILON;
  else return c;
}

function autOptsFromText(text: string): AutomatonOpts {
  const json = JSON.parse(text);

  const opts = {
    stateCount: json.stateNames.length,
    stateNames: json.stateNames,
    finalStates: json.finalStates,
    initialStates: json.initialStates,
    alphabet: json.alphabet.map((c: string) => replaceEps(c)),
    transitions: json.transitions.map((t: Transition) => ({ character: replaceEps(t.character), to: t.to, from: t.from })),
  }  

  return opts;
}

interface AppState {
  regex: string;
  aut: Automaton;
}

export default function App() {
  const wordFieldRef: Ref<HTMLInputElement> = useRef(null);
  const wordPRef: Ref<HTMLParagraphElement> = useRef(null);
  const regexRef: Ref<HTMLInputElement> = useRef(null);
  const networkRef: Ref<Network> = useRef(null);

  const [state, setState]: [AppState, any] = useState({
    regex: "a*",
    aut: regexToAut("a*", "1"),
  });

  let aut = state.aut;

  let currentWord = "";
  let currentCharIdx = 0;

  function onSetWord() {
    aut.reset();
    currentWord = wordFieldRef!.current.value;
    wordPRef.current.textContent = "Current Word: " + currentWord;
    currentCharIdx = 0;
  }

  function onReadChar() {
    if (currentCharIdx >= currentWord.length) return;

    aut.readChar(currentWord[currentCharIdx]);
    currentCharIdx += 1;
    const network: Network = networkRef.current!;
    network.setSelection({
      nodes: aut.highlightedStates,
      edges: aut.highlightedEdges,
    }, { highlightEdges: false });
  }

  function convertAut(type: AutomatonType) {
    switch (type) {
      case AutomatonType.DFA: setState({ aut: aut.toDFA() }); break;
      case AutomatonType.NFA: setState({ aut: aut.toNFA() }); break;
      case AutomatonType.ENFA: break;
      default: break;
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", background: "#fafafa", height: "100vh" }}>
      <h2 style={{ textAlign: "center", paddingTop: "20px" }}>Finite Automaton Example</h2>
      <div style={{display: "flex"}}>
        <div style={{ width: "800px", margin: "0 auto" }}>
          <AutomataGraph aut={aut} networkRef={networkRef} />
          <input ref={wordFieldRef} placeholder="Enter input word ..."/>
          <button onClick={ () => onSetWord() }>Set Word</button>
          <button onClick={ () => onReadChar() }>Read Next Character</button>
          <p ref={wordPRef}></p>
          <input ref={regexRef} placeholder='Enter regex ...'></input>
          <button onClick={ e => setState({regex: regexRef.current.value, aut: regexToAut(regexRef.current?.value, "1")}) }>Create {EPSILON}-NFA from Regex</button>
          <button onClick={ e => convertAut(AutomatonType.NFA) }>Convert to NFA</button>
          <button onClick={ e => convertAut(AutomatonType.DFA) }>Convert to DFA</button>
        </div>
      </div>
    </div>
  );
}
