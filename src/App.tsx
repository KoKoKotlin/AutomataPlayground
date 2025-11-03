import React, { createElement, useRef, useState, type Ref, type RefObject } from "react";
import "./App.css";
import AutomataGraph from "./AutomataGraph";
import {
  Automaton,
  AutomatonType,
  EPSILON,
  makeAut,
  RegexError,
  regexToAut,
  type AutomatonOpts,
  type Transition,
} from "./Automatons";
import type { Network } from "vis";
import AlgorithmDescription from "./DescriptionArea";
import { BuilderTabs } from "./Tabs";

export enum AutomatonBuilderState {
  MANUAL,
  REGEX,
}

export interface AppState {
  regex: string;
  aut: Automaton;
  disableDebugNames: boolean;
  acceptStatus: boolean | null;
  error: string | null;
  automatonBuilderState: AutomatonBuilderState;
}

let currentWord = "";
let currentCharIdx = 0;

export default function App() {
  const wordFieldRef: RefObject<HTMLInputElement | null> = useRef(null);
  const wordPRef: RefObject<HTMLParagraphElement | null> = useRef(null);
  const regexRef: RefObject<HTMLInputElement | null> = useRef(null);
  const networkRef: RefObject<Network | null> = useRef(null);

  const [state, setState]: [AppState, any] = useState({
    regex: "a*",
    aut: regexToAut("a*", "1"),
    disableDebugNames: true,
    acceptStatus: null,
    error: null,
    automatonBuilderState: AutomatonBuilderState.REGEX,
  });

  function regexToAutE(regex: string | undefined) {
    if (regex === undefined) {
      setState({ ...state, error: "Empty Regex is invalid!" });
      return;
    }

    try {
      const automaton = regexToAut(regex, "1");
      setState({ ...state, regex: regex, aut: automaton, error: null });
    } catch (e) {
      console.log(state.aut);
      if (e instanceof RegexError) {
        setState({ ...state, error: `Error: ${e.message}` });
      } else {
        setState({ ...state, error: "Unknown error while parsing regex." });
      }
    }
  }

  let aut = state.aut;

  function onSetWord() {
    aut.reset();
    currentWord = wordFieldRef.current!.value;
    currentCharIdx = 0;
    updateWordDisplay();
    setState({ ...state, acceptStatus: null });
  }

  function onReadChar() {
    if (currentCharIdx >= currentWord.length) return;

    const currentChar = currentWord[currentCharIdx];
    aut.readChar(currentChar);
    currentCharIdx += 1;

    const network: Network = networkRef.current!;
    network.setSelection({
      nodes: aut.highlightedStates,
      edges: aut.highlightedEdges,
    }, { highlightEdges: false });

    updateWordDisplay();

    if (currentCharIdx === currentWord.length) {
      const accepted = aut.isAccepted();
      setState({ ...state, acceptStatus: accepted });
    }
  }

  function updateWordDisplay() {
    if (!wordPRef.current) return;

    const chars = currentWord.split("").map((c, i) => {
      if (i === currentCharIdx)
        return `<span style="background: yellow; font-weight: bold;">${c}</span>`;
      else return c;
    });

    wordPRef.current.innerHTML =
      "Current Word: " + (chars.length ? chars.join("") : "");
  }

  function convertAut(type: AutomatonType) {
    switch (type) {
      case AutomatonType.DFA:
        setState({ ...state, aut: aut.toDFA() });
        break;
      case AutomatonType.NFA:
        setState({ ...state, aut: aut.toNFA() });
        break;
      case AutomatonType.ENFA:
        break;
      default:
        break;
    }
  }

  function minimizeAut() {
    setState({ ...state, aut: aut.minimize() });
  }

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        background: "#f5f5f5",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Finite Automaton Example
      </h2>

      <div
        style={{
          display: "flex",
          gap: "40px",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* Automaton Graph */}
        <div
          style={{
            width: "800px",
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <AutomataGraph state={state} networkRef={networkRef} />
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            minWidth: "300px",
          }}
        >
          {/* Word Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontWeight: 600 }}>Input Word:</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                ref={wordFieldRef}
                placeholder="Enter input word..."
                style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
              <button
                onClick={onSetWord}
                style={{ padding: "6px 12px", borderRadius: "6px", background: "#4caf50", color: "white", border: "none" }}
              >
                Set Word
              </button>
              <button
                onClick={onReadChar}
                style={{ padding: "6px 12px", borderRadius: "6px", background: "#2196f3", color: "white", border: "none" }}
              >
                Read Next
              </button>
            </div>
            <p
              ref={wordPRef}
              style={{ fontFamily: "monospace", fontSize: "1.1em", marginTop: "5px" }}
            ></p>
            {state.acceptStatus !== null && (
            <div
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                borderRadius: "6px",
                background: state.acceptStatus ? "#d4edda" : "#f8d7da",
                color: state.acceptStatus ? "#155724" : "#721c24",
                border: `1px solid ${state.acceptStatus ? "#c3e6cb" : "#f5c6cb"}`,
                fontWeight: 600,
                textAlign: "center",
                transition: "all 0.3s ease",
              }}
            >
              {state.acceptStatus ? "✅ Word accepted!" : "❌ Word rejected!"}
            </div>
          )}
          </div>
          
          <BuilderTabs
            active={state.automatonBuilderState}
            onChange={(newState) =>
              setState({ ...state, automatonBuilderState: newState })
            }
          />

          <div style={{ width: "600px", margin: "0 auto" }}>
            <div
              className={`builder-panel ${state.automatonBuilderState === AutomatonBuilderState.REGEX ? "" : "hidden"}`}
            >
              <RegexInput
                error={state.error}
                onClick={() => regexToAutE(regexRef.current?.value)}
                regexRef={regexRef}
              />
            </div>

            <div
              className={`builder-panel ${state.automatonBuilderState === AutomatonBuilderState.MANUAL ? "" : "hidden"}`}
            >
              <ManualInput setState={setState} state={state} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => convertAut(AutomatonType.NFA)}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#607d8b", color: "white", border: "none" }}
            >
              Convert to NFA
            </button>
            <button
              onClick={() => convertAut(AutomatonType.DFA)}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#9c27b0", color: "white", border: "none" }}
            >
              Convert to DFA
            </button>
                        <button
              onClick={() => minimizeAut()}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#2084afff", color: "white", border: "none" }}
            >
              Minimize DFA (Hopfcroft)
            </button>
          </div>

          {/* Options */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label>Hide Debug Names:</label>
            <input
              type="checkbox"
              checked={state.disableDebugNames}
              onChange={(e) =>
                setState({ ...state, disableDebugNames: !state.disableDebugNames })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ManalInputState {
  type: AutomatonType,
  alphabet: string,
  stateNames: Array<string>,
  transitions: Transition[],
  initialStates: number[],
  finalStates: number[]
}

function ManualInput(props: { setState: (arg0: AppState) => void, state: AppState }) {
  const [state, setState] = useState<ManalInputState>({
    type: AutomatonType.DFA,
    alphabet: "",
    stateNames: [],
    transitions: [],
    initialStates: [],
    finalStates: []
  });

  const typeSelectRef = useRef<HTMLSelectElement | null>(null);
  const stateNameRef = useRef<HTMLInputElement | null>(null);
  const alphabetRef = useRef<HTMLInputElement | null>(null);
  const toRef = useRef<HTMLSelectElement | null>(null);
  const fromRef = useRef<HTMLSelectElement | null>(null);
  const charRef = useRef<HTMLSelectElement | null>(null);

  const handleChangeType = () => {
    let type: AutomatonType = parseInt(typeSelectRef.current!.value);
    setState({ ...state, type });
  };

  const handleAddState = () => {
    const name = stateNameRef.current?.value.trim();
    if (name && !state.stateNames.includes(name)) {
      setState({ ...state, stateNames: [...state.stateNames, name] });
      stateNameRef.current!.value = "";
    }
  };

  const handleSetAlphabet = () => {
    const alpha = alphabetRef.current?.value.trim() || "";
    setState({ ...state, alphabet: alpha });
  };

  const handleAddTransition = () => {
    const to = parseInt(toRef.current!.value);
    const from = parseInt(fromRef.current!.value);
    const character = charRef.current!.value;

    if (!isNaN(to) && !isNaN(from) && character) {
      const transition: Transition = { to, from, character };
      setState({ ...state, transitions: [...state.transitions, transition] });
    }
  };

  const handleSetInitFinState = (i: number) => {
    if (!state.initialStates.includes(i) && !state.finalStates.includes(i)) {
      setState({ ...state, initialStates: state.initialStates.concat(i) });
    } else if (state.initialStates.includes(i) && !state.finalStates.includes(i)) {
      let initialStates = state.initialStates;
      initialStates.splice(initialStates.indexOf(i), 1);
      setState({ ...state, finalStates: state.finalStates.concat(i), initialStates });
    } else {
      let finalStates = state.finalStates;
      finalStates.splice(finalStates.indexOf(i), 1);
      setState({ ...state, finalStates });
    }
  }

  const getColor = (i: number) => {
    if (state.initialStates.includes(i)) {
      return "white";
    } else if (state.finalStates.includes(i)) {
      return "black";
    } else {
      return "black";
    }
  };

  const getBackColor = (i: number) => {
    if (state.initialStates.includes(i)) {
      return "black";
    } else if (state.finalStates.includes(i)) {
      return "green";
    } else {
      return "red";
    }
  };

  const handleCreateAutomaton = () => {
    let opts: AutomatonOpts = {
      stateCount: state.stateNames.length,
      stateNames: state.stateNames,
      alphabet: state.alphabet,
      finalStates: state.finalStates,
      initialStates: state.initialStates,
      transitions: state.transitions,
    };
    // FIXME: handle exceptions
    let aut = makeAut(state.type, opts);
    props.setState({ ...props.state, aut });
  };

  return (
    <div className="manual-input">
      <h3 className="manual-input__title">Manual Automaton Builder</h3>

      <div className="manual-input__field">
        <label className="manual-input__label">Automaton Type</label>
        <select ref={typeSelectRef} onChange={handleChangeType} className="manual-input__select" defaultValue="DFA">
          <option value={AutomatonType.DFA}>DFA</option>
          <option value={AutomatonType.NFA}>NFA</option>
          <option value={AutomatonType.ENFA}>ε-NFA</option>
        </select>
      </div>

      <div className="manual-input__field">
        <label className="manual-input__label">Alphabet</label>
        <div className="manual-input__input-group">
          <input
            ref={alphabetRef}
            type="text"
            placeholder="e.g., abc"
            className="manual-input__input"
          />
          <button onClick={handleSetAlphabet} className="manual-input__btn manual-input__btn--small">
            Set
          </button>
        </div>
        
        {state.alphabet && (
          <p className="manual-input__info">Σ = { state.alphabet.split('').join(', ') }</p>
        )}
      </div>

      <div className="manual-input__field">
        <label className="manual-input__label">States</label>
        <div className="manual-input__input-group">
          <input
            ref={stateNameRef}
            type="text"
            placeholder="e.g., q0"
            className="manual-input__input"
          />
          <button onClick={handleAddState} className="manual-input__btn manual-input__btn--small">
            Add
          </button>
        </div>
        <div className="manual-input__tags">
          {state.stateNames.map((name, i) => (
            <span onClick={() => handleSetInitFinState(i)} key={i} style={{ "color": getColor(i), "backgroundColor": getBackColor(i), "cursor": "pointer" }} className="manual-input__tag">
              {name}
            </span>
          ))}
          <div style={{ color: "grey", "fontSize": 10 }}>Hint: Click on states to change to initial or final state. (<strong>Black</strong> = Initial, <strong>Green</strong> = Final)</div>
        </div>
      </div>

      <div className="manual-input__field">
        <label className="manual-input__label">Transitions</label>
        <div className="manual-input__transition-builder">
          <select ref={fromRef} className="manual-input__select">
            <option value="">From</option>
            {state.stateNames.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>

          <span className="manual-input__arrow">→</span>

          <select ref={charRef} className="manual-input__select">
            <option value="">Symbol</option>
            {state.alphabet.split('').map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
            {state.type == AutomatonType.ENFA 
              && <option key={-1} value={EPSILON}>{EPSILON}</option>}
          </select>

          <span className="manual-input__arrow">→</span>

          <select ref={toRef} className="manual-input__select">
            <option value="">To</option>
            {state.stateNames.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>

          <button onClick={handleAddTransition} className="manual-input__btn manual-input__btn--icon">
            +
          </button>
        </div>

        <div className="manual-input__transitions-list">
          {state.transitions.length === 0 ? (
            <p className="manual-input__placeholder">No transitions added yet.</p>
          ) : (
            state.transitions.map((t, i) => (
              <div key={i} className="manual-input__transition">
                <strong>{state.stateNames[t.from] || `q${t.from}`}</strong>
                <span className="manual-input__transition-char"> —{t.character}→ </span>
                <strong>{state.stateNames[t.to] || `q${t.to}`}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <button onClick={handleCreateAutomaton} className="manual-input__create-btn">
        Create Automaton
      </button>
    </div>
  );
}

function RegexInput(props: {error: string | null, onClick: () => void, regexRef: Ref<HTMLInputElement>}) {
  return (<><div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
    <label style={{ fontWeight: 600 }}>Regex:</label>
    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
      <input
        ref={props.regexRef}
        placeholder="Enter regex..."
        style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
      />
      <button
        onClick={props.onClick}
        style={{ padding: "6px 12px", borderRadius: "6px", background: "#ff9800", color: "white", border: "none" }}
      >
        Create ε-NFA
      </button>
    </div>
    {props.error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
        {props.error}
      </div>
    )}
  </div>
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      marginTop: "20px",
      padding: "10px",
      background: "#f0f0f0",
      borderRadius: "8px",
    }}
  >
    <label style={{ fontWeight: 600 }}>Regex Explanation:</label>
    <ul style={{ paddingLeft: "20px", margin: 0, lineHeight: "1.5em" }}>
      <li>
        <b>Letters and other symbols</b>: a-z, A-Z, 0-9, or any symbols not used as regex syntax
      </li>
      <li>
        <b>?</b>: zero or one occurrence of the preceding element
      </li>
      <li>
        <b>*</b>: zero or more occurrences of the preceding element
      </li>
      <li>
        <b>+</b>: one or more occurrences of the preceding element
      </li>
      <li>
        <b>|</b>: alternative of two expressions (e.g., <code>a|b</code> means "a" or "b")
      </li>
      <li>
        <b>()</b>: grouping of expressions (e.g., <code>(ab)*</code> means "ab" zero or more times)
      </li>
    </ul>
  </div></>);
}