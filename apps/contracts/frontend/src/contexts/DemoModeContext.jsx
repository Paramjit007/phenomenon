/**
 * DemoModeContext — global toggle that switches the UI into presentation mode.
 *
 * When demoMode === true:
 *   - S/M/L/XL panel-size buttons are hidden (irrelevant in 3-pane layout).
 *   - ErrorTriggerForTests components are hidden (no accidental test-throws).
 *   - A gold "DEMO" badge appears in the header.
 *
 * Usage:
 *   import { useDemoMode } from "../contexts/DemoModeContext.jsx";
 *   const { demoMode, toggleDemo } = useDemoMode();
 */
import { createContext, useContext, useState } from "react";

const DemoModeContext = createContext({
  demoMode: false,
  toggleDemo: () => {},
});

export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false);
  const toggleDemo = () => setDemoMode((d) => !d);
  return (
    <DemoModeContext.Provider value={{ demoMode, toggleDemo }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}

export default DemoModeContext;
