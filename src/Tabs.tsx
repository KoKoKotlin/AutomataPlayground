import React from "react";
import "./App.css";
import { AutomatonBuilderState } from "./App";

interface TabsProps {
  active: AutomatonBuilderState;
  onChange: (state: AutomatonBuilderState) => void;
}

export function BuilderTabs({ active, onChange }: TabsProps) {
  return (
    <div className="tabs">
      <button
        className={`tab ${active === AutomatonBuilderState.REGEX ? "active" : ""}`}
        onClick={() => onChange(AutomatonBuilderState.REGEX)}
      >
        Regex to ε-NFA
      </button>
      <button
        className={`tab ${active === AutomatonBuilderState.MANUAL ? "active" : ""}`}
        onClick={() => onChange(AutomatonBuilderState.MANUAL)}
      >
        Manual Builder
      </button>
    </div>
  );
}