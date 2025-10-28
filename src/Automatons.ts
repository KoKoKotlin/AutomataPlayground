export const EPSILON = "ε";

function atos(...numbers: number[]): string {
  return numbers.join(",");
}

function stoa(s: string): Array<number> {
  return s.split(",").map(d => parseInt(d));
}


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

  protected currentStates: Array<number>;

  highlightedStates: Array<number> = [];
  highlightedEdges: Array<number> = [];

  constructor(opts: AutomatonOpts) {
    this.opts = opts;
    this.currentStates = this.initialStates;
    this.highlightedStates = this.initialStates;
  }

  reset() {
    this.currentStates = this.initialStates;
    this.highlightedStates = this.initialStates;
    this.highlightedEdges = [];
  }

  abstract checkCorrect(): boolean;

  getAllTransitions(c: string, from: number): Array<Transition> {
    return this.transitions.filter(t => t.character === c && t.from === from);
  }

  readChar(c: string) {
    let nextStates: Set<number> = new Set();
    this.highlightedEdges = [];

    let currentStates = this.getEpsClojure(new Set(this.currentStates));
    for (const from of currentStates) {
      const transitionsUsed = this.getAllTransitions(c, from);
      transitionsUsed.forEach(t => this.highlightedEdges.push(this.transitions.indexOf(t)));
      this.getEpsClojure(new Set(transitionsUsed.map(t => t.to))).forEach(idx => nextStates.add(idx));
    }

    this.highlightedStates = Array.from(nextStates);
    this.currentStates = Array.from(nextStates);
  }

  acceptsWord(s: string): boolean {
    this.reset();

    for (const c of s) {
      if (this.currentStates.length === 0) return false;
      this.readChar(c);
    }
    
    return this.currentStates.some(s => this.finalStates.includes(s));
  }

  isAccepted(): boolean {
    return this.currentStates.some(idx => this.finalStates.includes(idx));
  }

  getEpsClojure(states: Set<number>): Set<number> {
    let epsClojure: Set<number> = new Set(states);
    for (const from of epsClojure) {
      this.transitions
        .filter(t => t.character == EPSILON && t.from == from)
        .forEach(t => {
          this.highlightedEdges.push(this.transitions.indexOf(t));
          epsClojure.add(t.to)
        });
    }

    return epsClojure;
  }

  abstract toNFA(): Automaton;
  abstract toDFA(): Automaton;
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

  toNFA(): Automaton {
    return this;
  }

  toDFA(): Automaton {
    return this;
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
  
  toNFA(): Automaton {
    return this;
  }

  toDFA(): Automaton {
    let dfaStates: Array<string> = [];
    let dfaTransitions: Array<Transition> = [];

    dfaStates.push(atos(...this.initialStates));
    let currentStateIdx = 0;
    for (const state of dfaStates) {
      let nfaStates = stoa(state);
      for (const c of this.alphabet) {
        let newStates: Set<number> = new Set();
        for (const from of nfaStates) {
          this.getAllTransitions(c, from).forEach(t => newStates.add(t.to));
        }
        let newDfaState = atos(...Array.from(newStates));
        if (!dfaStates.includes(newDfaState)) {
          dfaStates.push(newDfaState);
        }
        let newStateIdx = dfaStates.indexOf(newDfaState);        
        dfaTransitions.push(mt(c, currentStateIdx, newStateIdx));
      }
      currentStateIdx++;
    }

    let finalStates = [];
    currentStateIdx = 0;
    for (const state of dfaStates) {
      if (stoa(state).some(idx => this.finalStates.includes(idx))) {
        finalStates.push(currentStateIdx);
      }
      currentStateIdx++;
    }

    let opts: AutomatonOpts = {
      stateCount: dfaStates.length,
      stateNames: dfaStates,
      transitions: dfaTransitions,
      alphabet: this.alphabet,
      initialStates: [0],
      finalStates: finalStates,
    };

    return makeAut(AutomatonType.DFA, opts);
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

  toDFA(): Automaton {
    return this.toNFA().toDFA(); 
  }

  toNFA(): Automaton {
    let nfaFinalstates = this.finalStates.concat(this.initialStates
      .filter(idx => Array.from(this.getEpsClojure(new Set([idx]))).some(fIdx => this.finalStates.includes(fIdx))));
    
    let nfaTransitions: Array<Transition> = [];
    for (let i = 0; i < this.stateCount; i++) {
      for (const c of this.alphabet) {
        this.currentStates = [i];
        this.readChar(c);
        this.currentStates.forEach(idx => nfaTransitions.push(mt(c, i, idx)));
      }
    }

    let opts: AutomatonOpts = {
      stateCount: this.stateCount,
      stateNames: this.stateNames,
      transitions: nfaTransitions,
      alphabet: this.alphabet,
      initialStates: Array.from(this.getEpsClojure(new Set(this.initialStates))),
      finalStates: nfaFinalstates
    };
    return makeAut(AutomatonType.NFA, opts);
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
  SUBREGEX, // token that contains the inside of paranthesis, or subexpr for | operator
  EOI, // end of input
}

const OPERATOR_TOKENS = [TokenType.STAR, TokenType.PLUS, TokenType.QUESTION_MARK];

class Token {
  text: string;
  type: TokenType;

  constructor(text: string, type: TokenType) {
    this.text = text;
    this.type = type;
  }
}

export class RegexError extends Error {
  position: number;
  constructor(message: string, position: number) {
    super(message);
    this.name = "RegexError";
    this.position = position;
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

    return new Token(this.regexString.substring(startIdx, this.currentIdx - 1), TokenType.SUBREGEX);
  }

  nextGroup(): Token {
    let startIdx = this.currentIdx;
    let currentToken = this.nextToken();

    switch (currentToken.type) {
      case TokenType.PIPE:
      case TokenType.PLUS:
      case TokenType.STAR:
      case TokenType.QUESTION_MARK:
        return new Token("Group cannot start with operator!", TokenType.ERROR);
      case TokenType.EOI:
        return new Token("Group cannot be empty!", TokenType.ERROR);
      case TokenType.CLOSING_PAREN:
        return new Token("Group cannot start with '('!", TokenType.ERROR);
      case TokenType.OPENING_PAREN: {
        // consume the parentheses
        let token = this.getParentheses();
        if (token.type == TokenType.ERROR) {
          return new Token("Error while trying to get next group: " + token.text, TokenType.ERROR);
        }
        // if next token is an operator, also consume it
        if (OPERATOR_TOKENS.includes(this.lookAhead().type)) {
          this.nextToken();
        }
      } break;
      case TokenType.SYMBOL: {
        // if next token is an operator, also consume it
        if (OPERATOR_TOKENS.includes(this.lookAhead().type)) {
          this.nextToken();
        }
      } break;
    }

    return new Token(this.regexString.substring(startIdx, this.currentIdx), TokenType.SUBREGEX);
  }
}

export function regexToAut(regex: string, label: string): Automaton {
  try {
    const lexer = new Lexer(regex);
    let currentToken = lexer.nextToken();

    let automatons: Array<Automaton> = [];
    let labelCounter = 0;

    while (currentToken.type !== TokenType.EOI) {
      switch (currentToken.type) {
        case TokenType.OPENING_PAREN: {
          const subregex = lexer.getParentheses();
          if (subregex.type === TokenType.ERROR)
            throw new RegexError(subregex.text, lexer.currentIdx);
          const aut = regexToAut(subregex.text, label + "RX");
          automatons.push(aut);
          break;
        }
        case TokenType.CLOSING_PAREN:
          throw new RegexError(
            `Parenthesis at ${lexer.currentIdx - 1} has no matching opening parenthesis!`,
            lexer.currentIdx - 1
          );

        case TokenType.SYMBOL: {
          const aut = rtaSymbol(currentToken.text, label + "S" + labelCounter.toString());
          automatons.push(aut);
          labelCounter += 1;
          break;
        }

        case TokenType.PLUS:
        case TokenType.QUESTION_MARK:
        case TokenType.STAR: {
          const aut = automatons.pop();
          if (!aut)
            throw new RegexError(
              `Operator '${currentToken.text}' at ${lexer.currentIdx - 1} has no expression in front!`,
              lexer.currentIdx - 1
            );

          let newAut;
          switch (currentToken.type) {
            case TokenType.PLUS:
              newAut = rtaPlus(aut, label + "+" + labelCounter.toString());
              break;
            case TokenType.QUESTION_MARK:
              newAut = rtaQuestionMark(aut, label + "?" + labelCounter.toString());
              break;
            case TokenType.STAR:
              newAut = rtaStar(aut, label + "*" + labelCounter.toString());
              break;
          }
          labelCounter += 1;
          automatons.push(newAut!);
          break;
        }

        case TokenType.PIPE: {
          if (lexer.lookAhead().type === TokenType.EOI)
            throw new RegexError("Unexpected end of input after '|' operator!", lexer.currentIdx);

          const aut1 = automatons.pop();
          if (!aut1)
            throw new RegexError("Operator '|' needs two subexpressions!", lexer.currentIdx);

          const subexpr = lexer.nextGroup();
          if (subexpr.type === TokenType.ERROR)
            throw new RegexError(subexpr.text, lexer.currentIdx);

          const aut2 = regexToAut(subexpr.text, label + "PX");
          automatons.push(rtaPipe(aut1, aut2, label + "|" + labelCounter.toString()));
          labelCounter += 1;
          break;
        }
      }

      currentToken = lexer.nextToken();
    }

    if (automatons.length === 0)
      throw new RegexError("Empty or invalid regex!", 0);

    return automatons.reduce((acc, aut) => (acc === undefined ? aut : rtaConcat(acc, aut)));
  } catch (e) {
    if (e instanceof RegexError) {
      console.error(`Regex error: ${e.message}!`);
      throw e;
    }
    throw new Error("Unexpected internal error in regex parser!");
  }
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

  return makeAut(AutomatonType.ENFA, opts);
}
