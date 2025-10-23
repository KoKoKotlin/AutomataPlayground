export const EPSILON = "ε";

export interface Transition {
  character: string;
  from: number;
  to: number;
}

export enum AutomatonType {
    DFA,
    NFA,
    ENFA,
};

export interface AutomatonOpts {
  readonly alphabet: string;
  readonly stateCount: number
  readonly stateNames: Array<string>;
  readonly finalStates: Array<number>;
  readonly initialStates: Array<number>;
  readonly transitions: Array<Transition>;
}

export function makeAut(type: AutomatonType, opts: AutomatonOpts): Automaton {
  switch(type) {
    case AutomatonType.DFA: return new DFA(opts);
    case AutomatonType.NFA: return new NFA(opts);
    case AutomatonType.ENFA: return new ENFA(opts);
  }
}

export function mt(character: string, from: number, to: number): Transition {
  return { character, from, to };
}

export abstract class Automaton {
  private readonly opts;
  get alphabet(): string { return this.opts.alphabet; };
  get stateCount(): number { return this.opts.stateCount; };
  get stateNames(): Array<string> { return this.opts.stateNames; };
  get finalStates(): Array<number> { return this.opts.finalStates; };
  get initialStates(): Array<number> { return this.opts.initialStates; };
  get transitions(): Array<Transition> { return this.opts.transitions; };

  private currentStates: Array<number>;

  highlightedStates: Array<number> = [];
  highlightedEdges: Array<number> = [];

  constructor(opts: AutomatonOpts) {
    this.opts = opts;
    this.currentStates = this.initialStates;
    this.highlightedStates = this.initialStates;
  }

  // FIXME: check if epsilon clojure is needed on initial states
  reset() {
    this.currentStates = this.initialStates;
    this.highlightedStates = this.initialStates;
    this.highlightedEdges = [];
  }

  abstract checkCorrect(): boolean;

  getAllTransitions(c: string, from: number): Array<Transition> {
    let transitionsIdx = [];
    return this.transitions.filter(t => t.character === c && t.from === from);
  }

  readChar(c: string) {
    let nextStates: Array<number> = [];
    this.highlightedEdges = [];

    for (const from of this.currentStates) {
      const transitionsUsed = this.getAllTransitions(c, from);
      this.highlightedEdges = this.highlightedEdges.concat(transitionsUsed.map(t => this.transitions.indexOf(t)));
      const currNextStates = this.getEpsClojure(transitionsUsed.map(t => t.to));
      nextStates = nextStates.concat(currNextStates);
    }

    this.highlightedStates = nextStates;
    this.currentStates = nextStates;
  }

  acceptsWord(s: string): boolean {
    this.reset();

    for (const c of s) {
      if (this.currentStates.length === 0) return false;
      this.readChar(c);
    }
    
    return this.currentStates.some(s => this.finalStates.includes(s));
  }

  getEpsClojure(states: Array<number>): Array<number> {
    let epsClojure: Array<number> = [];
    for (const from of states) {
      let nextStates = this.transitions.filter(t => t.character == EPSILON && t.from == from).map(t => t.to);
      epsClojure = epsClojure.concat(nextStates);
    }
    epsClojure = epsClojure.concat(states);

    return epsClojure;
  }
}

class DFA extends Automaton {

  constructor(opts: AutomatonOpts) {
    super(opts);
    
    if (!this.checkCorrect()) throw new Error("Definition of DFA is not correct.");
  }

  checkCorrect(): boolean {
    // no epsilon transitions
    // only valid transitions
    for (const t of this.transitions) {
      if (t.character === EPSILON) return false;
      if (t.from >= this.stateCount || t.from < 0) return false;
    }

    // check that for each state and character combination there exists a transition
    for (let i = 0; i < this.stateCount; ++i) {
      for (const c of this.alphabet) {
        if (this.transitions.filter(t => t.character == c && t.from == i).length !== 1) return false;
      }
    }

    // only one initial state
    return this.initialStates.length === 1;
  }  
}

class NFA extends Automaton {
  constructor(opts: AutomatonOpts) {
    super(opts);
    
    if (!this.checkCorrect()) throw new Error("Definition of NFA is not correct.");
  }


  checkCorrect(): boolean {
    // no epsilon transitions
    // only valid transitions
    for (const t of this.transitions) {
      if (t.character === EPSILON) return false;
      if (t.from >= this.stateCount || t.from < 0) return false;
    }

    // at least one initial state
    return this.initialStates.length > 0;
  }  
}

class ENFA extends Automaton {
  constructor(opts: AutomatonOpts) {
    super(opts);
    
    if (!this.checkCorrect()) throw new Error("Definition of ENFA is not correct.");
  }

  checkCorrect(): boolean {
    // only valid transitions
    for (const t of this.transitions) {
      if (t.from >= this.stateCount || t.from < 0) return false;
    }

    // at least one initial state
    return this.initialStates.length > 0;
  }  
}
