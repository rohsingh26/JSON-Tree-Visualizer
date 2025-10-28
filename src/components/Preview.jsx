import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import * as htmlToImage from "html-to-image";
import { saveAs } from "file-saver";

const Preview = ({ parsedData }) => {
  const flowRef = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Recursive function to build nodes & edges
  const buildTree = useCallback((data, parentId = null, depth = 0, prefix = "root") => {
    const nodeId = prefix;
    const node = {
      id: nodeId,
      data: { label: Array.isArray(data) ? "Array" : typeof data === "object" ? "Object" : String(data) },
      position: { x: depth * 200, y: Math.random() * 400 },
      style: {
        background:
          typeof data === "object"
            ? Array.isArray(data)
              ? "#4CAF50" // Green for arrays
              : "#2196F3" // Blue for objects
            : "#FF9800", // Orange for primitives
        color: "#fff",
        padding: 10,
        borderRadius: 8,
      },
    };

    const newNodes = [node];
    const newEdges = [];

    if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([key, value], i) => {
        const childId = `${nodeId}-${key}`;
        const { nodes: childNodes, edges: childEdges } = buildTree(value, nodeId, depth + 1, childId);

        newNodes.push({
          id: childId,
          data: { label: `${key}` },
          position: { x: (depth + 1) * 200, y: i * 120 },
          style: {
            background:
              typeof value === "object"
                ? Array.isArray(value)
                  ? "#4CAF50"
                  : "#2196F3"
                : "#FF9800",
            color: "#fff",
            padding: 10,
            borderRadius: 8,
          },
        });

        newEdges.push({ id: `${nodeId}-${childId}`, source: nodeId, target: childId });
        newNodes.push(...childNodes);
        newEdges.push(...childEdges);
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }, []);

  // Build tree when parsedData changes
  useEffect(() => {
    if (parsedData) {
      const { nodes, edges } = buildTree(parsedData);
      setNodes(nodes);
      setEdges(edges);
    }
  }, [parsedData, buildTree, setNodes, setEdges]);

  const handleDownload = async () => {
    if (flowRef.current) {
      const image = await htmlToImage.toPng(flowRef.current);
      saveAs(image, "json-tree.png");
    }
  };

  return (
    <div className="preview-section">
      <h2>JSON Tree Visualization</h2>
      {parsedData ? (
        <>
          <div className="flow-container" ref={flowRef}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
          <button className="download-btn" onClick={handleDownload}>
            📸 Download as PNG
          </button>
        </>
      ) : (
        <p>Paste your JSON and click “Generate Tree” 🌳</p>
      )}
    </div>
  );
};

export default Preview;
