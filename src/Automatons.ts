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

enum TokenType {
  SYMBOL,
  PIPE,
  QUESTION_MARK,
  STAR,
  PLUS,
  OPENING_PAREN,
  CLOSING_PAREN,
  ERROR, // error token for signaling errors in the input
  SUBREGEX, // token that contains the inside of paranthesis
  EOI, // end of input
}

class Token {
  text: string;
  type: TokenType;

  constructor(text: string, type: TokenType) {
    this.text = text;
    this.type = type;
  }
}

class Lexer {
  regexString: string;
  currentIdx: number;

  constructor(regexString: string) {
    this.regexString = regexString;
    this.currentIdx = 0;
  }

  nextToken(): Token {
    const token = this.lookAhead();
    this.currentIdx += 1;

    return token;
  }

  lookAhead(): Token {
    if (this.currentIdx >= this.regexString.length) 
      return new Token("", TokenType.EOI);

    let currentSymbol = this.regexString[this.currentIdx];
    let type: TokenType | undefined = undefined;
    switch (currentSymbol) {
      case "|": type = TokenType.PIPE; break;
      case "+": type = TokenType.PLUS; break;
      case "?": type = TokenType.QUESTION_MARK; break;
      case "*": type = TokenType.STAR; break;
      case "(": type = TokenType.OPENING_PAREN; break;
      case ")": type = TokenType.CLOSING_PAREN; break;
      default: type = TokenType.SYMBOL;
    }

    return new Token(currentSymbol, type);
  }

  // this method assumes, that the last symbol read was a opening parenthesis
  getParentheses(): Token {
    let parenCount = 1;
    let startIdx = this.currentIdx;

    while (parenCount > 0) {
      const currentTok: Token = this.nextToken();
      switch (currentTok.type) {
        case TokenType.EOI:
          return new Token(`Parenthesis at ${startIdx - 1} not closed!`, TokenType.ERROR);
        case TokenType.OPENING_PAREN:
          parenCount += 1; break;
        case TokenType.CLOSING_PAREN:
          parenCount -= 1; break;
      }
    }

    return new Token(this.regexString.substring(startIdx, this.currentIdx), TokenType.SUBREGEX);
  }
}

// TODO: proper error display for users
export function regexToAut(regex: string, label: string): Automaton {
  let lexer = new Lexer(regex);
  let currentToken = lexer.nextToken();

  let automatons: Array<Automaton> = [];
  let labelCounter = 0;
  let doPipe = false;
  while (currentToken.type != TokenType.EOI) {
    console.log(currentToken);
    switch (currentToken.type) {
      case TokenType.OPENING_PAREN: {
        const subregex: Token = lexer.getParentheses();
        if (subregex.type == TokenType.ERROR) {
          throw new Error(subregex.text);
        }
        let aut = regexToAut(subregex.text, label + "X");
        automatons.push(aut);
      } break;
      case TokenType.CLOSING_PAREN: {
        throw new Error(`Parenthesis at ${lexer.currentIdx - 1} has no mathching opening paranthesis!`); // TODO: proper error display for users
      } break;
      case TokenType.SYMBOL: {
        const aut = rtaSymbol(currentToken.text, label + "S" + labelCounter.toString());
        automatons.push(aut);
        labelCounter += 1;
      } break;
      case TokenType.PLUS:
      case TokenType.QUESTION_MARK:
      case TokenType.STAR: {
        let aut = automatons.pop();
        if (aut === undefined) throw new Error(`Operator '${currentToken.text}' at ${lexer.currentIdx - 1} has no expression in front!`);
        switch (currentToken.type) {
          case TokenType.PLUS: 
            aut = rtaPlus(aut, label + "+" + labelCounter.toString()); break;
          case TokenType.QUESTION_MARK:
            aut = rtaQuestionMark(aut, label + "?" + labelCounter.toString()); break;
          case TokenType.STAR:
            aut = rtaStar(aut, label + "*" + labelCounter.toString()); break; 
        }
        labelCounter += 1;
        automatons.push(aut);
      } break;
      case TokenType.PIPE: {
        if (lexer.lookAhead().type === TokenType.EOI) {
          throw new Error("Unexpected end of input after '|' operator!");
        }

        currentToken = lexer.nextToken();
        doPipe = true;
        continue;
      } break;
    }
    
    if (doPipe) {
      doPipe = false;
      let aut1 = automatons.pop();
      let aut2 = automatons.pop();

      if (aut1 === undefined || aut2 === undefined) {
        throw new Error("Operator '|' needs two subexpressions!");
      }

      automatons.push(rtaPipe(aut1, aut2, label + "|" + labelCounter.toString()));
      labelCounter += 1;
    }
    currentToken = lexer.nextToken();
  }

  return automatons.reduce((acc, aut) => (acc === undefined) ? aut : rtaConcat(acc, aut));
}

function rtaConcat(aut1: Automaton, aut2: Automaton): Automaton {
  const newStateNames = aut1.stateNames.concat(aut2.stateNames);
  const newStateCount = aut1.stateCount + aut2.stateCount;
  let newTransitions = aut1.transitions.concat(
    aut2.transitions.map(t => mt(t.character, t.from + aut1.stateCount, t.to + aut1.stateCount))
  );
  
  for (let i of aut1.finalStates) {
    for (let j of aut2.initialStates) {
      newTransitions.push(mt(EPSILON, i, j + aut1.stateCount));
    }
  }

  const opts: AutomatonOpts = {
    stateCount: newStateCount,
    alphabet: aut1.alphabet.concat(aut2.alphabet),
    stateNames: newStateNames,
    initialStates: aut1.initialStates,
    finalStates: aut2.finalStates.map(idx => idx + aut1.stateCount),
    transitions: newTransitions
  };

  return makeAut(AutomatonType.ENFA, opts);
}

function rtaPipe(aut1: Automaton, aut2: Automaton, label: string): Automaton {
  const newStateNames = aut1.stateNames
    .concat(aut2.stateNames)
    .concat(["I" + label, "F" + label]);
  const newStateCount = aut1.stateCount + aut2.stateCount + 2;
  const newInitialStateIdx = newStateCount - 2;
  const newFinalStateIdx = newStateCount - 1;
  let newTransitions = aut1.transitions.concat(
    aut2.transitions.map(t => mt(t.character, t.from + aut1.stateCount, t.to + aut1.stateCount))
  );
  
  let initialStates = aut1.initialStates.concat(
    aut2.initialStates.map(idx => idx + aut1.stateCount)
  );
  for (let i of initialStates) {
    newTransitions.push(mt(EPSILON, newInitialStateIdx, i));
  }

  let finalStates = aut1.finalStates.concat(
    aut2.finalStates.map(idx => idx + aut1.stateCount)
  );
  for (let i of finalStates) {
    newTransitions.push(mt(EPSILON, i, newFinalStateIdx));
  }

  const opts: AutomatonOpts = {
    stateCount: newStateCount,
    alphabet: aut1.alphabet.concat(aut2.alphabet),
    stateNames: newStateNames,
    initialStates: [newInitialStateIdx],
    finalStates: [newFinalStateIdx],
    transitions: newTransitions
  };

  return makeAut(AutomatonType.ENFA, opts);
}

function rtaSymbol(symbol: string, label: string): Automaton {
    const opts: AutomatonOpts = {
    stateCount: 2,
    alphabet: symbol,
    stateNames: ["I" + label, "F" + label],
    initialStates: [0],
    finalStates: [1],
    transitions: [mt(symbol, 0, 1)]
  };

  return makeAut(AutomatonType.ENFA, opts);
}

function rtaQuestionMark(aut: Automaton, label: string): Automaton {
  let initialStates = aut.initialStates;
  let finalStates = aut.finalStates;

  const newStateNames = aut.stateNames.concat(["I" + label, "F" + label])
  const newInitialStateIdx = aut.stateCount - 2;
  const newFinalStateIdx = aut.stateCount - 1;
  let newTransitions = aut.transitions;
  
  for (let i of initialStates) {
    newTransitions.push(mt(EPSILON, newInitialStateIdx, i));
  }

  for (let i of finalStates) {
    newTransitions.push(mt(EPSILON, i, newFinalStateIdx));
  }

  const opts: AutomatonOpts = {
    stateCount: aut.stateCount + 2,
    alphabet: aut.alphabet,
    stateNames: newStateNames,
    initialStates: [newInitialStateIdx],
    finalStates: [newFinalStateIdx],
    transitions: newTransitions
  };

  return makeAut(AutomatonType.ENFA, opts);
}

function rtaPlus(aut: Automaton, label: string): Automaton {
  let initialStates = aut.initialStates;
  let finalStates = aut.finalStates;

  const newStateNames = aut.stateNames.concat(["I" + label, "F" + label])
  const newStateCount = aut.stateCount + 2;
  const newInitialStateIdx = newStateCount - 2;
  const newFinalStateIdx = newStateCount - 1;
  let newTransitions = aut.transitions;
  
  for (let i of initialStates) {
    newTransitions.push(mt(EPSILON, newInitialStateIdx, i));
  }

  for (let i of finalStates) {
    newTransitions.push(mt(EPSILON, i, newFinalStateIdx));
  }

  for (let i of initialStates) {
    for (let j of finalStates) {
      newTransitions.push(mt(EPSILON, j, i));
    }
  }

  const opts: AutomatonOpts = {
    stateCount: newStateCount,
    alphabet: aut.alphabet,
    stateNames: newStateNames,
    initialStates: [newInitialStateIdx],
    finalStates: [newFinalStateIdx],
    transitions: newTransitions
  };

  return makeAut(AutomatonType.ENFA, opts);
}

function rtaStar(aut: Automaton, label: string): Automaton {
  let initialStates = aut.initialStates;
  let finalStates = aut.finalStates;

  const newStateCount = aut.stateCount + 2;
  const newStateNames = aut.stateNames.concat(["I" + label, "F" + label])
  const newInitialStateIdx = newStateCount - 2;
  const newFinalStateIdx = newStateCount - 1;
  let newTransitions = aut.transitions;
  
  for (let i of initialStates) {
    newTransitions.push(mt(EPSILON, newInitialStateIdx, i));
  }

  for (let i of finalStates) {
    newTransitions.push(mt(EPSILON, i, newFinalStateIdx));
  }

  for (let i of initialStates) {
    for (let j of finalStates) {
      newTransitions.push(mt(EPSILON, j, i));
    }
  }

  newTransitions.push(mt(EPSILON, newInitialStateIdx, newFinalStateIdx));

  const opts: AutomatonOpts = {
    stateCount: newStateCount,
    alphabet: aut.alphabet,
    stateNames: newStateNames,
    initialStates: [newInitialStateIdx],
    finalStates: [newFinalStateIdx],
    transitions: newTransitions
  };

  console.log(opts);

  return makeAut(AutomatonType.ENFA, opts);
}

function regexToAutRec(regex: string) {}