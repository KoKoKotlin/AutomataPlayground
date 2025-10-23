import './App.css'
import AutomataGraph from './AutomataGraph';
import { AutomatonType, EPSILON, makeAut, mt, type AutomatonOpts } from './Automatons';

export default function App() {

  const opts: AutomatonOpts = {
    stateCount: 3,
    stateNames: ["q0", "q1", "q2"],
    finalStates: [1],
    initialStates: [0],
    alphabet: "ab" + EPSILON,
    transitions: new Map([[mt("a", 0), 1], [mt("b", 1), 2], [mt(EPSILON, 2), 0]])
  };
  const aut = makeAut(AutomatonType.ENFA, opts);

  return (
    <div style={{ fontFamily: "sans-serif", background: "#fafafa", height: "100vh" }}>
      <h2 style={{ textAlign: "center", paddingTop: "20px" }}>Finite Automaton Example</h2>
      <div style={{ width: "800px", margin: "0 auto" }}>
        <AutomataGraph aut={aut} />
      </div>
    </div>
  );
}
