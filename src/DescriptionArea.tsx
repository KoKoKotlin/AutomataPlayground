import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function AlgorithmDescription() {
  const [text, setText] = useState<string>(
    `# Algorithm Description

This automaton uses **subset construction** to convert an NFA to DFA.

For a set of NFA states $S$, the DFA transition on symbol $a$ is:

$$
\\delta_D(S, a) = \\bigcup_{s \in S} \\delta_N(s, a)
$$

Epsilon closures are computed as:

$$
\\epsilon\\_closure(q) = \\{ p \\mid q \\xrightarrow{\epsilon*} p \\}
$$
`
  );

  return (
    <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
      {/* Rendered Markdown + LaTeX */}
      <div
        style={{
          width: "400px",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          background: "white",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      >
        <ReactMarkdown
          children={text}
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        />
      </div>
    </div>
  );
}
