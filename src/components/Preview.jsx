import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const NODE_WIDTH = 220;
const LEVEL_HEIGHT = 120;

const isPrimitive = (v) =>
  v === null || ["string", "number", "boolean"].includes(typeof v);

const makeLabelForKeyValue = (key, value) => {
  if (isPrimitive(value)) return `${key}: ${String(value)}`;
  if (Array.isArray(value)) return `${key} {${value.length}}`;
  if (typeof value === "object" && value !== null)
    return `${key} {${Object.keys(value).length}}`;
  return String(key ?? "");
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export default function Preview({ parsedData }) {
  const flowContainerRef = useRef(null);
  const treeCaptureRef = useRef(null);
  const reactFlowInstanceRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [searchValue, setSearchValue] = useState("");
  const [message, setMessage] = useState("");
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);

  const posCountersRef = useRef({});
  const resetPosCounters = () => (posCountersRef.current = {});
  const nextXIndex = (depth) => {
    if (!posCountersRef.current[depth]) posCountersRef.current[depth] = 0;
    return posCountersRef.current[depth]++;
  };

  const buildTree = useCallback((data) => {
    resetPosCounters();
    const newNodes = [];
    const newEdges = [];

    const traverse = (value, keyName, depth, parentId, pathSoFar) => {
      let path;
      if (pathSoFar) path = pathSoFar;
      else if (keyName === null || keyName === undefined) path = "";
      else path = String(keyName);

      const label =
        keyName === null
          ? isPrimitive(value)
            ? String(value)
            : `{${Object.keys(value || {}).length}}`
          : makeLabelForKeyValue(keyName, value);

      const id = path || `${depth}-${Math.random().toString(36).slice(2, 7)}`;

      const xIndex = nextXIndex(depth);
      const position = { x: xIndex * NODE_WIDTH, y: depth * LEVEL_HEIGHT };

      const nodeStyle = {
        width: NODE_WIDTH - 30,
        padding: 8,
        borderRadius: 10,
        textAlign: "center",
        background: isPrimitive(value) ? "#FFB84D" : Array.isArray(value) ? "#34D399" : "#60A5FA",
        color: "#061021",
        border: "1px solid rgba(0,0,0,0.06)",
        fontSize: 13,
        whiteSpace: "pre-wrap",
      };

      newNodes.push({
        id,
        data: { label, path },
        position,
        style: nodeStyle,
        draggable: false,
        selectable: false,
      });

      if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item, idx) => {
            const childPath = path ? `${path}[${idx}]` : `[${idx}]`;
            const childId = childPath;
            newEdges.push({ id: `${id}-${childId}`, source: id, target: childId });
            traverse(item, `[${idx}]`, depth + 1, id, childPath);
          });
        } else {
          Object.entries(value).forEach(([k, v]) => {
            const childPath = path ? `${path}.${k}` : `${k}`;
            const childId = childPath;
            newEdges.push({ id: `${id}-${childId}`, source: id, target: childId });
            traverse(v, k, depth + 1, id, childPath);
          });
        }
      }
    };

    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      Object.entries(data).forEach(([k, v]) => traverse(v, k, 0, null, k));
    } else {
      traverse(data, null, 0, null, "");
    }

    return { nodes: newNodes, edges: newEdges };
  }, []);

  useEffect(() => {
    if (!parsedData) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const { nodes: builtNodes, edges: builtEdges } = buildTree(parsedData);
    setNodes(builtNodes);
    setEdges(builtEdges);

    setHighlightedNodeId(null);
    setMessage("");

    setTimeout(() => {
      try {
        reactFlowInstanceRef.current?.fitView({ padding: 0.2 });
      } catch (e) {}
    }, 120);
  }, [parsedData, buildTree, setNodes, setEdges]);

  const onInit = (rfi) => {
    reactFlowInstanceRef.current = rfi;
    setTimeout(() => {
      try {
        rfi.fitView({ padding: 0.2 });
      } catch (e) {}
    }, 120);
  };

  const normalizePath = (p) => {
    if (!p) return "";
    let s = p.trim();
    if (s.startsWith("$.")) s = s.slice(2);
    if (s.startsWith("$")) s = s.slice(1);
    if (s.startsWith(".")) s = s.slice(1);
    return s;
  };

  const onSearch = async () => {
    setMessage("");
    if (!searchValue) {
      setMessage("Please enter a path to search.");
      return;
    }
    const q = normalizePath(searchValue);
    const found = nodes.find((n) => n.data && n.data.path === q);
    if (!found) {
      setHighlightedNodeId(null);
      setNodes((nds) =>
        nds.map((n) => ({ ...n, style: { ...n.style, boxShadow: undefined, border: n.style?.border || "1px solid rgba(0,0,0,0.06)" } }))
      );
      setMessage("No match found");
      return;
    }

    setHighlightedNodeId(found.id);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === found.id
          ? {
              ...n,
              style: {
                ...n.style,
                border: "3px solid #ff6b00",
                boxShadow: "0 8px 18px rgba(255,107,0,0.18)",
                transform: "scale(1.02)",
                zIndex: 999,
              },
            }
          : { ...n, style: { ...n.style, boxShadow: undefined } }
      )
    );

    setMessage("Match found");

    try {
      if (reactFlowInstanceRef.current?.setCenter) {
        reactFlowInstanceRef.current.setCenter(found.position.x, found.position.y, { duration: 400 });
      } else if (reactFlowInstanceRef.current?.setViewport) {
        const { x, y } = found.position;
        reactFlowInstanceRef.current.setViewport({ x: -x + 200, y: -y + 200, zoom: 1 });
      } else if (reactFlowInstanceRef.current?.fitView) {
        reactFlowInstanceRef.current.fitView({ padding: 0.2 });
        await sleep(300);
      }
    } catch (err) {
      console.warn("Could not center view on node:", err);
    }
  };

  const zoomIn = () => {
    try {
      if (reactFlowInstanceRef.current?.zoomIn) reactFlowInstanceRef.current.zoomIn();
    } catch (e) {}
  };
  const zoomOut = () => {
    try {
      if (reactFlowInstanceRef.current?.zoomOut) reactFlowInstanceRef.current.zoomOut();
    } catch (e) {}
  };
  const fitView = () => {
    try {
      if (reactFlowInstanceRef.current?.fitView) reactFlowInstanceRef.current.fitView({ padding: 0.2 });
    } catch (e) {}
  };

  return (
    <div className="preview-section">
      <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <input
          type="text"
          placeholder='Search path e.g. $.user.address.city or items[0].name'
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontFamily: "monospace",
          }}
        />
        <button onClick={onSearch} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Search
        </button>
        <div style={{ minWidth: 140, textAlign: "center", color: message === "Match found" ? "green" : message === "No match found" ? "#e11d48" : "#6b7280" }}>
          {message}
        </div>
      </div>

      {parsedData ? (
        <>
          <div className="flow-container" ref={flowContainerRef} style={{ position: "relative" }}>
            <div
              ref={treeCaptureRef}
              className="tree-capture"
              style={{ width: "100%", height: "70vh", cursor: "grab" }}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                onInit={onInit}
                nodesDraggable={false}
                nodesConnectable={false}
                panOnDrag={true}
                panOnScroll={true}
                zoomOnScroll={true}
                zoomOnPinch={true}
              >
                <Background gap={20} />
              </ReactFlow>
            </div>

            <div
              style={{
                position: "absolute",
                left: 12,
                bottom: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                zIndex: 999,
                background: "rgba(255,255,255,0.9)",
                padding: 6,
                borderRadius: 8,
                boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
              }}
            >
              <button
                onClick={zoomIn}
                title="Zoom In"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                +
              </button>

              <button
                onClick={zoomOut}
                title="Zoom Out"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                -
              </button>

              <button
                onClick={fitView}
                title="Fit View"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ⤢
              </button>
            </div>
          </div>
        </>
      ) : (
        <p style={{ color: "grey" }}>Paste your JSON and click <b>Generate Tree</b>.</p>
      )}
    </div>
  );
}
