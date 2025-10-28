import React, { useRef, useState, type Ref } from "react";
import "./App.css";
import AutomataGraph from "./AutomataGraph";
import {
  Automaton,
  AutomatonType,
  EPSILON,
  RegexError,
  regexToAut,
  type AutomatonOpts,
} from "./Automatons";
import type { Network } from "vis";
import AlgorithmDescription from "./DescriptionArea";

export interface AppState {
  regex: string;
  aut: Automaton;
  disableDebugNames: boolean;
  acceptStatus: boolean | null;
  error: string | null;
}

let currentWord = "";
let currentCharIdx = 0;

export default function App() {
  const wordFieldRef: Ref<HTMLInputElement> = useRef(null);
  const wordPRef: Ref<HTMLParagraphElement> = useRef(null);
  const regexRef: Ref<HTMLInputElement> = useRef(null);
  const networkRef: Ref<Network> = useRef(null);

  const [state, setState]: [AppState, any] = useState({
    regex: "a*",
    aut: regexToAut("a*", "1"),
    disableDebugNames: true,
    acceptStatus: null,
    error: null,
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
    currentWord = wordFieldRef!.current.value;
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

          {/* Regex Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontWeight: 600 }}>Regex:</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                ref={regexRef}
                placeholder="Enter regex..."
                style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
              <button
                onClick={() => regexToAutE(regexRef.current?.value) }
                style={{ padding: "6px 12px", borderRadius: "6px", background: "#ff9800", color: "white", border: "none" }}
              >
                Create ε-NFA
              </button>
            </div>
            {state.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                {state.error}
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
          </div>

          {/* Automaton Conversion */}
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
