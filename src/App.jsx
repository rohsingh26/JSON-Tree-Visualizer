import React, { useState } from "react";
import Input from "./components/Input";
import Preview from "./components/Preview";
import Toggle from "./components/Toggle";
import "./styles/index.scss";

const App = () => {
  const [theme, setTheme] = useState("light");
  const [jsonData, setJsonData] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState("");

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleGenerate = () => {
    try {
      const parsed = JSON.parse(jsonData);
      setParsedData(parsed);
      setError("");
    } catch (err) {
      setError("Invalid JSON. Please check your input.");
      setParsedData(null);
    }
  };

  return (
    <div className={`app ${theme}`}>
      <header className="app-header">
        <h1 style={{ color: "gray" }}>JSON Tree Visualizer</h1>
        <Toggle theme={theme} toggleTheme={toggleTheme} />
      </header>

      <main className="app-main">
        <Input
          jsonData={jsonData}
          setJsonData={setJsonData}
          onGenerate={handleGenerate}
          error={error}
        />
        <Preview parsedData={parsedData} />
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} JSON Visualizer</p>
      </footer>
    </div>
  );
};

export default App;
