"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Play, Terminal } from "lucide-react";
import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

const CodeEditor = () => {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [useRemoteDb, setUseRemoteDb] = useState(false);
  const [dbConfig, setDbConfig] = useState({
    host: "",
    port: "",
    username: "",
    password: "",
    database: "",
  });

  const languageOptions = [
    { label: "Python", value: "python" },
    { label: "PySpark", value: "pyspark" },
    { label: "Snowflake (Snowpark)", value: "snowflake" },
    { label: "Databricks", value: "databricks" },
    { label: "Redshift", value: "redshift" },
    { label: "BigQuery", value: "bigquery" },
  ];

  const handleRun = async () => {
    try {
      const response = await axios.post("/api/execute", {
        language,
        code,
        dbConfig: useRemoteDb ? dbConfig : null,
      });
      setOutput(response.data.output);
    } catch (error) {
      setOutput(error.response?.data?.error || "An error occurred.");
    }
  };

  const handleDbChange = (field, value) => {
    setDbConfig({ ...dbConfig, [field]: value });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-black dark:text-white">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg space-y-6 border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block mb-1 text-sm font-semibold">
            Select Language
          </label>
          <div className="flex items-center gap-3">
  
  <Select  value={language} onValueChange={(val) => setLanguage(val)}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Select a language" />
    </SelectTrigger>
    <SelectContent>
      {languageOptions.map((opt) => (
        <SelectItem className="cursor-pointer" key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

        </div>

        <div className="h-[400px] border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <Editor
            height="100%"
            language={
              ["python", "pyspark", "snowflake", "databricks"].includes(
                language
              )
                ? "python"
                : "sql"
            }
            defaultValue="<!-- Write your code here -->"
            value={code}
            theme="vs-dark"
            onChange={(value) => setCode(value || "")}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="use-db"
            checked={useRemoteDb}
            onChange={(e) => setUseRemoteDb(e.target.checked)}
            className="accent-blue-600 w-4 h-4"
          />
          <label
            htmlFor="use-db"
            className="text-sm font-medium cursor-pointer"
          >
            Use Remote DB
          </label>
        </div>

        {useRemoteDb && (
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Host"
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              value={dbConfig.host}
              onChange={(e) => handleDbChange("host", e.target.value)}
            />
            <input
              type="text"
              placeholder="Port"
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              value={dbConfig.port}
              onChange={(e) => handleDbChange("port", e.target.value)}
            />
            <input
              type="text"
              placeholder="Username"
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              value={dbConfig.username}
              onChange={(e) => handleDbChange("username", e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              value={dbConfig.password}
              onChange={(e) => handleDbChange("password", e.target.value)}
            />
            <input
              type="text"
              placeholder="Database"
              className="p-2 col-span-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              value={dbConfig.database}
              onChange={(e) => handleDbChange("database", e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end">
  <button
    onClick={handleRun}
    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2 cursor-pointer"
  >
    <Play size={16} /> {/* Adjust size as needed */}
    Run
  </button>
</div>
<div className="flex items-center mb-2">
            <Terminal size={16} className="mr-2 text-gray-700 dark:text-gray-400" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Output</h3>
          </div>
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-sm overflow-auto max-h-80">
          
          <pre className="whitespace-pre-wrap break-words">
            {output || "Output will appear here..."}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
