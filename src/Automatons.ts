export const EPSILON = "ε";

interface TransitionKey {
  character: string;
  stateIdx: number;
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
  readonly transitions: Map<TransitionKey, number>;
}

export function makeAut(type: AutomatonType, opts: AutomatonOpts): Automaton {
  switch(type) {
    case AutomatonType.DFA: return new DFA(opts);
    case AutomatonType.NFA: return new NFA(opts);
    case AutomatonType.ENFA: return new ENFA(opts);
  }
}

export function mt(character: string, stateIdx: number): TransitionKey {
  return { character, stateIdx };
}

export abstract class Automaton {
  private readonly opts;
  get alphabet(): string { return this.opts.alphabet; };
  get stateCount(): number { return this.opts.stateCount; };
  get stateNames(): Array<string> { return this.opts.stateNames; };
  get finalStates(): Array<number> { return this.opts.finalStates; };
  get initialStates(): Array<number> { return this.opts.initialStates; };
  get transitions(): Map<TransitionKey, number> { return this.opts.transitions; };

  constructor(opts: AutomatonOpts) {
    this.opts = opts;
  }

  abstract checkCorrect(): boolean;
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
      if (t[0].character === EPSILON) return false;
      if (t[0].stateIdx >= this.stateCount || t[0].stateIdx < 0) return false;
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
  constructor(opts: AutomatonOpts) {
    super(opts);
    
    if (!this.checkCorrect()) throw new Error("Definition of NFA is not correct.");
  }


  checkCorrect(): boolean {
    // no epsilon transitions
    // only valid transitions
    for (const t of this.transitions) {
      if (t[0].character === EPSILON) return false;
      if (t[0].stateIdx >= this.stateCount || t[0].stateIdx < 0) return false;
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
      if (t[0].stateIdx >= this.stateCount || t[0].stateIdx < 0) return false;
    }

    // at least one initial state
    return this.initialStates.length > 0;
  }  
}
