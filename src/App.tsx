import './App.css'
import AutomataGraph from './AutomataGraph';

const EPSILON = "ε";

interface TransitionKey {
  character: string;
  stateIdx: number;
}

function mt(character: string, stateIdx: number): TransitionKey {
  return { character, stateIdx };
}

abstract class Automaton {
  readonly alphabet: string;
  readonly stateCount: number
  readonly stateNames: [string];
  readonly finalStates: [number];
  readonly initialStates: [number];
  readonly transitions: Map<TransitionKey, number>;

  constructor(alphabet: string, stateCount: number, stateNames: [string], finalStates: [number], initialStates: [number], transitions: Map<TransitionKey, number>) {
    this.alphabet = alphabet;
    this.stateCount = stateCount;
    this.stateNames = stateNames;
    this.finalStates = finalStates;
    this.initialStates = initialStates;
    this.transitions = transitions;
  }

  abstract checkCorrect(): boolean;
}

class DFA extends Automaton {
  constructor(alphabet: string, stateCount: number, stateNames: [string], finalStates: [number], initialStates: [number], transitions: Map<TransitionKey, number>) {
    super(alphabet, stateCount, stateNames, finalStates, initialStates, transitions);
    
    if (!this.checkCorrect()) throw new Error("Definition of DFA is not correct.");
  }

  checkCorrect(): boolean {
    // no epsilon transitions
    for (const t of this.transitions) {
      if (t[0].character === EPSILON) return false;
    }

    // check that for each state and character combination there exists a transition
    for (let i = 0; i < this.stateCount; ++i) {
      for (const c of this.alphabet) {
        if (Array.from(this.transitions.keys())
          .filter((key, _) => key.character == c && key.stateIdx == i)
          .length != 1) return false;
      }
    }

    // only one initial state
    return this.initialStates.length === 1;
  }  
}

class NFA extends Automaton {
  constructor(alphabet: string, stateCount: number, stateNames: [string], finalStates: [number], initialStates: [number], transitions: Map<TransitionKey, number>) {
    super(alphabet, stateCount, stateNames, finalStates, initialStates, transitions);
    
    if (!this.checkCorrect()) throw new Error("Definition of DFA is not correct.");
  }

  checkCorrect(): boolean {
    // no epsilon transitions
    for (const t of this.transitions) {
      if (t[0].character === EPSILON) return false;
    }

    // at least one initial state
    return this.initialStates.length > 0;
  }  
}

class ENFA extends Automaton {
  constructor(alphabet: string, stateCount: number, stateNames: [string], finalStates: [number], initialStates: [number], transitions: Map<TransitionKey, number>) {
    super(alphabet, stateCount, stateNames, finalStates, initialStates, transitions);
    
    if (!this.checkCorrect()) throw new Error("Definition of DFA is not correct.");
  }

  checkCorrect(): boolean {
    // at least one initial state
    return this.initialStates.length > 0;
  }  
}

export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", background: "#fafafa", height: "100vh" }}>
      <h2 style={{ textAlign: "center", paddingTop: "20px" }}>Finite Automaton Example</h2>
      <div style={{ width: "800px", margin: "0 auto" }}>
        <AutomataGraph />
      </div>
    </div>
  );
}
