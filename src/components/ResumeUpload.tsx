"use client";

import { useState, useRef, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconUpload, IconFile, IconCheck, IconX } from "@tabler/icons-react";
import { uploadResume, matchStored } from "@/lib/api";
import type { MatchResult } from "@/lib/api";

type Props = {
  token: string;
  onMatchComplete: (results: MatchResult[]) => void;
};

export default function ResumeUpload({ token, onMatchComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      return;
    }
    setFile(f);
    setError("");
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      await uploadResume(token, file);
      const matches = await matchStored(token);
      setSuccess(true);
      onMatchComplete(matches.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div
      className="p-6 rounded-[16px]"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <h2
        className="text-[var(--text)] text-base font-medium mb-4"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        Resume
      </h2>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 py-4"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,153,153,0.15)" }}
            >
              <IconCheck size={20} color="#009999" />
            </div>
            <p
              className="text-sm text-[var(--text)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Resume uploaded &mdash; showing your matches below
            </p>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <motion.div
              className="w-8 h-8 rounded-full border-2 mx-auto mb-3"
              style={{
                borderColor: "var(--border)",
                borderTopColor: "var(--teal)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p
              className="text-sm text-[var(--muted2)]"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              Analyzing your resume against 8,000+ jobs...
            </p>
          </motion.div>
        ) : (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="py-8 rounded-[12px] text-center cursor-pointer transition-all duration-200"
              style={{
                border: dragging
                  ? "2px dashed var(--teal)"
                  : "2px dashed var(--border)",
                background: dragging
                  ? "rgba(99,102,241,0.05)"
                  : "transparent",
              }}
            >
              <IconUpload
                size={24}
                className="mx-auto mb-2"
                style={{ color: "var(--muted)" }}
              />
              <p
                className="text-sm text-[var(--muted2)]"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
              >
                Drop your resume here or click to upload
              </p>
              <p
                className="text-xs text-[var(--muted)] mt-1"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                PDF only
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
            </div>

            {/* Selected file */}
            {file && (
              <div className="flex items-center gap-3 mt-4">
                <IconFile size={18} style={{ color: "var(--teal)" }} />
                <span
                  className="text-sm text-[var(--text)] flex-1 truncate"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {file.name}
                </span>
                <span
                  className="text-xs text-[var(--muted)]"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  {formatSize(file.size)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <IconX size={16} style={{ color: "var(--muted)" }} />
                </button>
              </div>
            )}

            {/* Upload button */}
            {file && (
              <button
                onClick={handleSubmit}
                className="w-full mt-4 py-3 rounded-[10px] text-sm font-medium text-white"
                style={{
                  background: "var(--teal)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Upload &amp; Match
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p
          className="text-sm mt-3"
          style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
