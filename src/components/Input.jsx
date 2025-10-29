import React from "react";

const Input = ({ jsonData, setJsonData, onGenerate, error }) => {
  return (
    <div className="input-section">
      <h2 style={{ color: "grey" }}>Enter JSON Data</h2>
      <textarea className="input-section-box"
        placeholder='Paste your JSON here...'
        value={jsonData}
        onChange={(e) => setJsonData(e.target.value)}
      />
      {error && <p className="error-msg">{error}</p>}

      <button className="generate-btn" onClick={onGenerate}>
        Generate Tree
      </button>
    </div>
  );
};

export default Input;
