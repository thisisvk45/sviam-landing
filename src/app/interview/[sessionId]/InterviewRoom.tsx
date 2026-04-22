"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoicePipeline } from "@/lib/voice-pipeline";
import {
  IconPlayerPlay,
  IconCheck,
  IconAlertTriangle,
  IconSend,
  IconLoader2,
  IconEye,
  IconBrowserCheck,
  IconClock,
  IconBolt,
  IconCode,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react";

type Phase = "waiting" | "briefing" | "active" | "completed";

type SessionData = {
  session_id: string;
  candidate_name: string;
  status: string;
  config: {
    name: string;
    duration_minutes: number;
    question_count: number;
    programming_languages: string[];
  };
} | null;

type TranscriptEntry = {
  role: "ai" | "candidate";
  text: string;
  type?: "question" | "answer" | "interrupt" | "code";
};

type Scorecard = {
  verdict: string;
  overall_score: number;
  competencies: Record<string, { score: number; evidence: string; gaps: string }>;
  red_flags: string[];
  standout_moments: string[];
  hiring_recommendation_rationale: string;
};

export default function InterviewRoom({
  sessionId,
  sessionData,
}: {
  sessionId: string;
  sessionData: SessionData;
}) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(sessionData?.config.question_count || 5);
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interrupt, setInterrupt] = useState("");
  const [tabSwitches, setTabSwitches] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [warning, setWarning] = useState("");
  const [interruptTrigger, setInterruptTrigger] = useState<string>("");
  const [nudge, setNudge] = useState("");
  const [faceDetected, setFaceDetected] = useState(true);
  const [eyeTrackingActive, setEyeTrackingActive] = useState(false);
  const [lookAwayCount, setLookAwayCount] = useState(0);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  const [tabWarningOverlay, setTabWarningOverlay] = useState(false);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [welcomeText, setWelcomeText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [voicePipelineActive, setVoicePipelineActive] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCodeRef = useRef("");
  const lastAnswerRef = useRef("");
  const codeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFaceSeenRef = useRef(Date.now());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastKeystrokeRef = useRef(0);
  const typingBufferRef = useRef<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const spokenTextRef = useRef("");
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voicePipelineRef = useRef<VoicePipeline | null>(null);
  const voicePipelineActiveRef = useRef(false);

  const config = sessionData?.config;
  const candidateName = sessionData?.candidate_name || "Candidate";
  const personaName = (sessionData?.config as Record<string, unknown> | undefined)?.persona as string | undefined;
  const PERSONA_NAMES: Record<string, string> = {
    arya: "Arya", vikram: "Vikram", priya: "Priya", rahul: "Rahul", ananya: "Ananya",
  };
  const displayPersona = PERSONA_NAMES[personaName || "arya"] || "Arya";

  // ── Text-to-Speech ──
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const speak = useCallback((text: string) => {
    // When voice pipeline is active, TTS comes from backend — skip browser speechSynthesis
    if (voicePipelineActiveRef.current) return;
    if (!voiceEnabledRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    // Try to pick a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel"))
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // Preload voices (some browsers load them async)
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // ── System checks ──
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setMicReady(true))
      .catch(() => setMicReady(false));

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        setCameraReady(true);
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch(() => setCameraReady(false));
  }, []);

  // ── WebSocket connection ──
  const connectWs = useCallback(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsUrl = API_URL.replace("http", "ws") + `/ws/interview/${sessionId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "welcome":
          setWelcomeText(msg.text);
          setTranscript((prev) => [...prev, { role: "ai", text: msg.text, type: "question" }]);
          if (msg.voice_pipeline) {
            setVoicePipelineActive(true);
            voicePipelineActiveRef.current = true;
          } else {
            speak(msg.text);
          }
          break;

        case "question":
          setCurrentQuestion(msg.text);
          setQuestionNumber(msg.question_number);
          setTotalQuestions(msg.total_questions);
          setTranscript((prev) => [...prev, { role: "ai", text: msg.text, type: "question" }]);
          setInterrupt("");
          speak(msg.text);
          break;

        case "interrupt":
          setInterrupt(msg.text);
          setInterruptTrigger(msg.trigger || "");
          setTranscript((prev) => [...prev, { role: "ai", text: msg.text, type: "interrupt" }]);
          speak(msg.text);
          break;

        case "interview_complete":
          speak("Your interview is now complete. Thank you for your time. The hiring team will review your responses shortly.");
          setPhase("completed");
          break;

        case "scorecard_generating":
          // Just wait
          break;

        case "scorecard_ready":
          setScorecard(msg.scorecard);
          break;

        case "nudge":
          setNudge(msg.text);
          speak(msg.text);
          setTimeout(() => setNudge(""), 5000);
          break;

        case "ai_speaking_start":
          setIsSpeaking(true);
          voicePipelineRef.current?.handleSpeakingStart();
          break;

        case "ai_speaking_end":
          setIsSpeaking(false);
          voicePipelineRef.current?.handleSpeakingEnd();
          break;

        case "audio_out":
          if (voiceEnabledRef.current) {
            voicePipelineRef.current?.handleAudioOut(msg.data);
          }
          break;

        case "transcript_partial":
          setPartialTranscript(msg.text);
          break;

        case "transcript_final":
          setPartialTranscript("");
          spokenTextRef.current = msg.text;
          setSpokenText(msg.text);
          break;

        case "stt_fallback":
          // Deepgram disconnected mid-session — activate browser SpeechRecognition
          setVoicePipelineActive(false);
          voicePipelineActiveRef.current = false;
          break;

        case "tts_fallback":
          // Cartesia failed for this message ��� use browser TTS as one-off fallback
          if (msg.text && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(msg.text);
            utterance.rate = 1.0;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
          }
          break;

        case "warning":
          setWarning(msg.message);
          setTimeout(() => setWarning(""), 3000);
          break;

        case "error":
          setWarning(msg.message);
          break;

        case "timeout":
          speak("Your interview has timed out due to inactivity.");
          setPhase("completed");
          break;
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    return ws;
  }, [sessionId]);

  // ── Start interview ──
  const handleStart = async () => {
    setPhase("briefing");

    // Request permissions and keep stream alive for video preview + eye tracking
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      // Attach stream to video element once active phase renders it
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      }, 2500);
    } catch {
      // Continue without camera if denied
    }

    // Connect WebSocket
    connectWs();

    // Transition to active after welcome speech finishes (or 6s max)
    setTimeout(() => setPhase("active"), 6000);
  };

  // ── Send violation event to backend ──
  const sendViolation = useCallback((action: string, target: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "violation", action, target }));
    }
  }, []);

  // ── Request fullscreen on active phase ──
  useEffect(() => {
    if (phase === "active") {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Browser may block without user gesture — non-critical
      });
    }
  }, [phase]);

  // ── Fullscreen exit detection ──
  useEffect(() => {
    if (phase !== "active") return;
    const handleFsChange = () => {
      if (!document.fullscreenElement && phase === "active") {
        sendViolation("fullscreen_exit", "");
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "fullscreen_exit" }));
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [phase, sendViolation]);

  // ── Screen share for periodic screenshots ──
  useEffect(() => {
    if (phase !== "active") return;
    let cancelled = false;

    (async () => {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (cancelled) { screen.getTracks().forEach((t) => t.stop()); return; }
        screenStreamRef.current = screen;

        // Hidden video element to draw frames from
        const vid = document.createElement("video");
        vid.srcObject = screen;
        vid.muted = true;
        vid.playsInline = true;
        await vid.play();
        screenVideoRef.current = vid;

        // If user stops screen share, log it
        screen.getVideoTracks()[0]?.addEventListener("ended", () => {
          sendViolation("screen_share_stopped", "");
        });

        // Capture screenshot every 30 seconds
        screenshotIntervalRef.current = setInterval(() => {
          if (!screenVideoRef.current || screenVideoRef.current.readyState < 2) return;
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 180;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(screenVideoRef.current, 0, 0, 320, 180);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: "screenshot",
                data: dataUrl,
                timestamp: new Date().toISOString(),
              }));
            }
          } catch {
            // Canvas capture can fail, non-critical
          }
        }, 30000);
      } catch {
        // User denied screen share — log but continue
        sendViolation("screen_share_denied", "");
      }
    })();

    return () => {
      cancelled = true;
      if (screenshotIntervalRef.current) clearInterval(screenshotIntervalRef.current);
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    };
  }, [phase, sendViolation]);

  // ── Anti-cheat: block copy, paste, right-click, drag-drop, keyboard shortcuts ──
  useEffect(() => {
    if (phase !== "active") return;

    const blockPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setPasteAttempts((n) => n + 1);
      sendViolation("paste_attempt", (e.target as HTMLElement)?.tagName || "unknown");
      setWarning("Paste is disabled during this interview.");
      setTimeout(() => setWarning(""), 3000);
    };

    const blockCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      sendViolation("copy_attempt", (e.target as HTMLElement)?.tagName || "unknown");
    };

    const blockCut = (e: ClipboardEvent) => {
      e.preventDefault();
      sendViolation("cut_attempt", (e.target as HTMLElement)?.tagName || "unknown");
    };

    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      sendViolation("right_click", (e.target as HTMLElement)?.tagName || "unknown");
    };

    const blockDragDrop = (e: DragEvent) => {
      e.preventDefault();
      sendViolation("drag_drop", (e.target as HTMLElement)?.tagName || "unknown");
    };

    const blockShortcuts = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        setPasteAttempts((n) => n + 1);
        sendViolation("keyboard_paste", "");
        setWarning("Paste is disabled during this interview.");
        setTimeout(() => setWarning(""), 3000);
      }
      if (ctrl && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        sendViolation("keyboard_copy", "");
      }
      // Block Ctrl+A (select all) on textareas is too aggressive, allow it
    };

    document.addEventListener("paste", blockPaste, true);
    document.addEventListener("copy", blockCopy, true);
    document.addEventListener("cut", blockCut, true);
    document.addEventListener("contextmenu", blockContextMenu, true);
    document.addEventListener("drop", blockDragDrop, true);
    document.addEventListener("dragover", (e) => e.preventDefault(), true);
    document.addEventListener("keydown", blockShortcuts, true);

    return () => {
      document.removeEventListener("paste", blockPaste, true);
      document.removeEventListener("copy", blockCopy, true);
      document.removeEventListener("cut", blockCut, true);
      document.removeEventListener("contextmenu", blockContextMenu, true);
      document.removeEventListener("drop", blockDragDrop, true);
      document.removeEventListener("keydown", blockShortcuts, true);
    };
  }, [phase, sendViolation]);

  // ── Attach video stream when videoRef becomes available ──
  useEffect(() => {
    if (phase === "active" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase]);

  // ── Eye tracking via FaceDetector API (Chromium) ──
  useEffect(() => {
    if (phase !== "active") return;

    // Check if FaceDetector is available (Chrome/Edge)
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      setEyeTrackingActive(true);

      faceCheckRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const faces = await detector.detect(videoRef.current);
          if (faces.length > 0) {
            setFaceDetected(true);
            lastFaceSeenRef.current = Date.now();
          } else {
            const awayMs = Date.now() - lastFaceSeenRef.current;
            if (awayMs > 2000) {
              setFaceDetected(false);
              setLookAwayCount((n) => n + 1);
              // Send eye tracking event to backend
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: "eye_tracking_event",
                  event: "looking_away",
                  duration_seconds: Math.round(awayMs / 1000),
                }));
              }
            }
          }
        } catch {
          // FaceDetector can fail on some frames, non-critical
        }
      }, 1500);
    } else {
      // Fallback: just show video, no face detection
      setEyeTrackingActive(false);
    }

    return () => {
      if (faceCheckRef.current) clearInterval(faceCheckRef.current);
    };
  }, [phase]);

  // ── Timer ──
  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // ── Speech-to-Text: listen to candidate's voice (browser fallback only) ──
  useEffect(() => {
    if (phase !== "active") return;
    // When voice pipeline is active, STT is handled by Deepgram on the backend
    if (voicePipelineActive) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return; // Not supported

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (event: { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } }) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
          // Send finalized speech to backend as answer content
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "speech_update",
              text: finalTranscript.trim(),
            }));
          }
        } else {
          interim += result[0].transcript;
        }
      }
      const combined = finalTranscript + interim;
      spokenTextRef.current = combined;
      setSpokenText(combined);
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart unless interview ended
      if (recognitionRef.current) {
        try { recognition.start(); } catch { /* already started */ }
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      // Restart on error (e.g. "no-speech")
      setTimeout(() => {
        if (recognitionRef.current) {
          try { recognition.start(); } catch { /* ignore */ }
        }
      }, 500);
    };

    try { recognition.start(); } catch { /* ignore */ }

    return () => {
      recognitionRef.current = null;
      try { recognition.stop(); } catch { /* ignore */ }
    };
  }, [phase, voicePipelineActive]);

  // Pause/resume recognition when AI is speaking (avoid picking up TTS)
  useEffect(() => {
    if (!recognitionRef.current) return;
    if (isSpeaking) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    } else if (phase === "active") {
      setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch { /* ignore */ }
        }
      }, 300);
    }
  }, [isSpeaking, phase]);

  // ── Voice Pipeline init: capture mic audio and stream to backend ──
  useEffect(() => {
    if (phase !== "active" || !voicePipelineActive) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const pipeline = new VoicePipeline(wsRef.current);
    voicePipelineRef.current = pipeline;
    pipeline.startCapture(streamRef.current || undefined);
    setIsListening(true);

    return () => {
      pipeline.destroy();
      voicePipelineRef.current = null;
    };
  }, [phase, voicePipelineActive]);

  // Reset spoken text when submitting / moving to next question
  const resetSpokenText = useCallback(() => {
    spokenTextRef.current = "";
    setSpokenText("");
  }, []);

  // ── Code sync every 2 seconds ──
  useEffect(() => {
    if (phase === "active") {
      codeIntervalRef.current = setInterval(() => {
        if (code !== lastCodeRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "code_update", code }));
          lastCodeRef.current = code;
        }
      }, 2000);
    }
    return () => {
      if (codeIntervalRef.current) clearInterval(codeIntervalRef.current);
    };
  }, [phase, code]);

  // ── Answer sync every 2 seconds (enables mid-answer interrupts) ──
  useEffect(() => {
    if (phase === "active") {
      answerIntervalRef.current = setInterval(() => {
        if (answer !== lastAnswerRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "answer_update", answer }));
          lastAnswerRef.current = answer;
        }
      }, 2000);
    }
    return () => {
      if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
    };
  }, [phase, answer]);

  // ── Typing cadence: flush buffer every 500ms ──
  useEffect(() => {
    if (phase === "active") {
      typingIntervalRef.current = setInterval(() => {
        const buf = typingBufferRef.current;
        if (buf.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "typing_batch",
            deltas: buf,
            timestamp: new Date().toISOString(),
          }));
          typingBufferRef.current = [];
        }
      }, 500);
    }
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, [phase]);

  // ── Tab detection with escalation ──
  useEffect(() => {
    if (phase !== "active") return;

    const handleTabLeave = () => {
      setTabSwitches((prev) => {
        const next = prev + 1;
        // Show overlay warning when they come back
        setTabWarningOverlay(true);
        // Auto-end interview after 5 tab switches
        if (next >= 5) {
          handleEnd();
        }
        return next;
      });
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "tab_switch_event", timestamp: new Date().toISOString() })
        );
      }
    };

    const handleVisibility = () => {
      if (document.hidden) handleTabLeave();
    };

    // When they return, keep overlay for 3 seconds
    const handleFocus = () => {
      setTimeout(() => setTabWarningOverlay(false), 3000);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleTabLeave);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleTabLeave);
      window.removeEventListener("focus", handleFocus);
    };
  }, [phase]);

  // ── Submit answer ──
  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);

    // Combine typed answer + spoken text
    const fullAnswer = [answer, spokenTextRef.current].filter(Boolean).join("\n\n");

    const payload = {
      type: "answer_submit",
      answer: fullAnswer || "(code submission)",
      code,
      spoken_text: spokenTextRef.current || "",
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }

    setTranscript((prev) => [
      ...prev,
      { role: "candidate", text: fullAnswer || code.slice(0, 200), type: "answer" },
    ]);
    setAnswer("");
    setCode("");
    setInterrupt("");
    setInterruptTrigger("");
    resetSpokenText();
    setSubmitting(false);
  };

  // ── Typing cadence keydown handler ──
  const handleCodeKeyDown = useCallback(() => {
    const now = Date.now();
    if (lastKeystrokeRef.current > 0) {
      const delta = now - lastKeystrokeRef.current;
      typingBufferRef.current.push(delta);
    }
    lastKeystrokeRef.current = now;
  }, []);

  // ── End interview ──
  const handleEnd = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_interview" }));
    }
    // Stop voice pipeline
    voicePipelineRef.current?.destroy();
    voicePipelineRef.current = null;
    // Stop TTS and speech recognition
    window.speechSynthesis?.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    // Stop camera + screen share streams
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    // Exit fullscreen
    document.exitFullscreen?.().catch(() => {});
    setPhase("completed");
  };

  // ── Format time ──
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ──────────── RENDER ────────────

  // WAITING PHASE
  if (phase === "waiting") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <span
            className="gradient-text inline-block mb-6"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            SViam
          </span>

          <h1
            className="text-[var(--text)] mb-2"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Your interview is ready
          </h1>
          <p className="text-sm text-[var(--muted2)] mb-8" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            {candidateName} &middot; {config?.name || "Technical Interview"}
          </p>

          {/* System checks */}
          <div
            className="p-5 rounded-[14px] mb-6 text-left space-y-3"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <p className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-dm-mono)" }}>
              System Check
            </p>
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${cameraReady ? "bg-green-500" : "bg-red-400"}`} />
              <span className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Camera: {cameraReady ? "Detected" : "Not found"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${micReady ? "bg-green-500" : "bg-red-400"}`} />
              <span className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Microphone: {micReady ? "Detected" : "Not found"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Screen share: Will be requested on start
              </span>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!micReady}
            className="w-full py-3.5 rounded-[12px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 20px rgba(0,153,153,0.3)" }}
          >
            <IconPlayerPlay size={16} /> Start Interview
          </button>

          <p className="text-[0.6rem] text-[var(--muted)] mt-4 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Your camera, microphone, and screen will be monitored during this interview. Tab switches and eye movement are tracked.
          </p>
        </motion.div>
      </main>
    );
  }

  // BRIEFING PHASE
  if (phase === "briefing") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-lg">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, var(--teal), #7c3aed)",
              boxShadow: isSpeaking ? "0 0 30px rgba(0,153,153,0.5)" : "0 0 15px rgba(0,153,153,0.3)",
              transition: "box-shadow 0.3s",
            }}
          >
            <span className="text-lg font-bold text-white">AI</span>
          </div>
          {welcomeText ? (
            <>
              <p
                className="text-sm text-[var(--text)] leading-relaxed mb-4"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 400 }}
              >
                {welcomeText}
              </p>
              {isSpeaking && (
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full"
                      style={{ background: "var(--teal)" }}
                      animate={{ height: [4, 16, 4] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <IconLoader2 size={24} className="animate-spin mx-auto mb-4" style={{ color: "var(--teal)" }} />
              <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Setting up your interview environment...
              </p>
            </>
          )}
        </motion.div>
      </main>
    );
  }

  // COMPLETED PHASE
  if (phase === "completed") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,153,153,0.1)" }}
          >
            <IconCheck size={32} style={{ color: "var(--teal)" }} />
          </div>
          <h1
            className="text-[var(--text)] mb-3"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            Interview Complete
          </h1>
          <p className="text-sm text-[var(--muted2)] mb-8" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Your responses have been recorded. The hiring team will review your interview shortly.
          </p>

          {scorecard && (
            <div className="p-5 rounded-[14px] text-left" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  Interview Score
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: scorecard.verdict === "Strong Hire" ? "rgba(0,153,153,0.1)" : scorecard.verdict === "Hire" ? "rgba(99,102,241,0.1)" : "rgba(239,68,68,0.1)",
                    color: scorecard.verdict === "Strong Hire" ? "var(--teal)" : scorecard.verdict === "Hire" ? "#6366f1" : "#ef4444",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {scorecard.verdict}
                </span>
              </div>
              <p className="text-3xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                {scorecard.overall_score}/10
              </p>
              <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                {scorecard.hiring_recommendation_rationale}
              </p>
            </div>
          )}

          {!scorecard && (
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--muted2)]">
              <IconLoader2 size={14} className="animate-spin" />
              <span style={{ fontFamily: "var(--font-dm-sans)" }}>Generating scorecard...</span>
            </div>
          )}

          <p className="mt-8 text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Thank you for interviewing with SViam
          </p>
        </motion.div>
      </main>
    );
  }

  // ACTIVE PHASE — Main interview UI
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between"
        style={{ background: "rgba(10,10,14,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <span className="gradient-text text-sm font-bold" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            SViam
          </span>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
            <IconClock size={12} />
            {formatTime(elapsedSeconds)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs" style={{ fontFamily: "var(--font-dm-mono)", color: faceDetected ? "#3b82f6" : "#ef4444" }}>
            <span
              className="relative flex h-2.5 w-2.5"
            >
              {faceDetected && (
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                  style={{ background: "#3b82f6" }}
                />
              )}
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ background: faceDetected ? "#3b82f6" : "#ef4444" }}
              />
            </span>
            <IconEye size={12} />
            <span>{faceDetected ? "Tracking" : "Face not detected"}</span>
          </div>
          {lookAwayCount > 0 && (
            <span className="text-[0.6rem] text-red-400" style={{ fontFamily: "var(--font-dm-mono)" }}>
              Away: {lookAwayCount}x
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs" style={{ fontFamily: "var(--font-dm-mono)", color: tabSwitches > 0 ? "#ef4444" : "var(--muted2)" }}>
            <IconBrowserCheck size={12} />
            <span>Tabs: {tabSwitches}/5</span>
          </div>
          {pasteAttempts > 0 && (
            <span className="text-[0.6rem] text-red-400" style={{ fontFamily: "var(--font-dm-mono)" }}>
              Paste: {pasteAttempts}x
            </span>
          )}
          {!wsConnected && (
            <span className="text-[0.6rem] text-red-400" style={{ fontFamily: "var(--font-dm-mono)" }}>Reconnecting...</span>
          )}
          <button
            onClick={() => {
              setVoiceEnabled((v) => !v);
              if (voiceEnabled) {
                window.speechSynthesis?.cancel();
                voicePipelineRef.current?.stopPlayback();
              }
            }}
            className="px-2 py-1 rounded-[6px] text-xs flex items-center gap-1 transition-colors hover:bg-white/5"
            style={{ fontFamily: "var(--font-dm-mono)", color: voiceEnabled ? "var(--teal)" : "var(--muted)" }}
            title={voiceEnabled ? "Mute AI voice" : "Unmute AI voice"}
          >
            {voiceEnabled ? <IconVolume size={14} /> : <IconVolumeOff size={14} />}
            <span>{voiceEnabled ? "Voice On" : "Voice Off"}</span>
          </button>
          <button
            onClick={handleEnd}
            className="px-3 py-1 rounded-[6px] text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Warning toast */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-[8px] flex items-center gap-2"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <IconAlertTriangle size={14} className="text-red-400" />
            <span className="text-xs text-red-300" style={{ fontFamily: "var(--font-dm-sans)" }}>{warning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nudge toast (inactivity) */}
      <AnimatePresence>
        {nudge && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-[8px] flex items-center gap-2"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            <IconClock size={14} className="text-yellow-400" />
            <span className="text-xs text-yellow-300" style={{ fontFamily: "var(--font-dm-sans)" }}>{nudge}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab switch warning overlay */}
      <AnimatePresence>
        {tabWarningOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          >
            <div className="text-center px-8">
              <IconAlertTriangle size={48} className="mx-auto mb-4" style={{ color: "#ef4444" }} />
              <h2
                className="text-xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Tab Switch Detected
              </h2>
              <p className="text-sm text-red-300 mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                You have switched away from the interview {tabSwitches} time{tabSwitches !== 1 && "s"}.
              </p>
              <p className="text-xs text-red-400/80" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {tabSwitches >= 3
                  ? `Warning: ${5 - tabSwitches} more switch${5 - tabSwitches !== 1 ? "es" : ""} and your interview will be automatically ended.`
                  : "All tab switches are logged and visible to the interviewer."}
              </p>
              <p className="text-[0.6rem] text-[var(--muted)] mt-4" style={{ fontFamily: "var(--font-dm-mono)" }}>
                This warning will dismiss in 3 seconds...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — two columns */}
      <div className="flex-1 pt-12 flex flex-col lg:flex-row">
        {/* Left — Code editor */}
        <div className="flex-1 flex flex-col p-4 lg:border-r" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <IconCode size={14} style={{ color: "var(--teal)" }} />
            <span className="text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
              {config?.programming_languages?.[0] || "python"}
            </span>
          </div>

          {/* Code editor (textarea fallback — CodeMirror can be added later) */}
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleCodeKeyDown}
            placeholder="Write your solution here..."
            className="flex-1 min-h-[300px] lg:min-h-[400px] p-4 rounded-[12px] text-sm resize-none outline-none focus:ring-1 focus:ring-[var(--teal)]"
            style={{
              background: "#1e1e2e",
              color: "#cdd6f4",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "0.8rem",
              lineHeight: 1.6,
              border: "1px solid var(--border)",
            }}
            spellCheck={false}
          />

          {/* Voice transcription */}
          {(spokenText || partialTranscript) && (
            <div className="mt-3 p-3 rounded-[10px]" style={{ background: "rgba(0,153,153,0.05)", border: "1px solid rgba(0,153,153,0.15)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                {isListening ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "#ef4444" }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#ef4444" }} />
                  </span>
                ) : (
                  <span className="flex h-2 w-2 rounded-full" style={{ background: "var(--muted)" }} />
                )}
                <span className="text-[0.6rem] uppercase tracking-wider text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  {isListening ? "Listening..." : "Mic paused"}
                </span>
              </div>
              <p className="text-xs text-[var(--muted2)] leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {spokenText}
                {partialTranscript && (
                  <span className="italic text-[var(--muted)]"> {partialTranscript}</span>
                )}
              </p>
            </div>
          )}

          {!spokenText && isListening && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: "rgba(0,153,153,0.03)", border: "1px dashed rgba(0,153,153,0.15)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "#ef4444" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#ef4444" }} />
              </span>
              <span className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Speak to explain your approach — your voice is being transcribed
              </span>
            </div>
          )}

          {/* Answer text area */}
          <div className="mt-3">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type additional notes (optional — your voice is captured above)..."
              className="w-full p-3 rounded-[10px] text-sm resize-none outline-none focus:ring-1 focus:ring-[var(--teal)]"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "var(--font-dm-sans)",
                border: "1px solid var(--border)",
                minHeight: "60px",
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || (!code.trim() && !answer.trim() && !spokenText.trim())}
            className="mt-3 w-full py-3 rounded-[10px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
          >
            {submitting ? <IconLoader2 size={14} className="animate-spin" /> : <IconSend size={14} />}
            Submit Answer
          </button>
        </div>

        {/* Right — AI interviewer */}
        <div className="lg:w-[400px] flex flex-col p-4">
          {/* Webcam preview */}
          <div className="relative mb-3 rounded-[12px] overflow-hidden" style={{ background: "#1e1e2e", border: "1px solid var(--border)" }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-[140px] object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {/* Eye tracking indicator overlay */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
              <span
                className="relative flex h-2 w-2"
              >
                {faceDetected && eyeTrackingActive && (
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "#3b82f6" }} />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: faceDetected ? "#3b82f6" : "#ef4444" }} />
              </span>
              <span className="text-[0.55rem] text-white/80" style={{ fontFamily: "var(--font-dm-mono)" }}>
                {eyeTrackingActive ? (faceDetected ? "Eye tracking active" : "Look at screen") : "Camera on"}
              </span>
            </div>
            {!faceDetected && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}>
                <p className="text-xs text-red-400 font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  Please face the camera
                </p>
              </div>
            )}
          </div>

          {/* AI avatar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--teal), #7c3aed)", boxShadow: isSpeaking ? "0 0 20px rgba(0,153,153,0.6)" : "0 0 12px rgba(0,153,153,0.3)", transition: "box-shadow 0.3s" }}
              >
                <span className="text-xs font-bold text-white">AI</span>
              </div>
              {isSpeaking && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "var(--teal)" }} />
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: "var(--teal)" }} />
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {displayPersona} — SViam AI
                {isSpeaking && <span className="ml-2 text-[0.6rem] text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-mono)" }}>speaking...</span>}
              </p>
              <p className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                Question {questionNumber} of {totalQuestions}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mb-4" style={{ background: "var(--surface)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%`, background: "var(--teal)" }}
            />
          </div>

          {/* Current question */}
          <div className="p-4 rounded-[14px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p
              className="text-sm text-[var(--text)] leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 400 }}
            >
              {currentQuestion || "Waiting for question..."}
            </p>
          </div>

          {/* Interrupt display */}
          <AnimatePresence>
            {interrupt && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-[12px] mb-4"
                style={{
                  background: interruptTrigger === "paste_detected" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                  border: `1px solid ${interruptTrigger === "paste_detected" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.2)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {interruptTrigger === "paste_detected" ? (
                    <IconAlertTriangle size={12} style={{ color: "#ef4444" }} />
                  ) : (
                    <IconBolt size={12} style={{ color: "#f59e0b" }} />
                  )}
                  <span
                    className="text-[0.6rem] uppercase tracking-wider font-semibold"
                    style={{
                      color: interruptTrigger === "paste_detected" ? "#ef4444" : "#f59e0b",
                      fontFamily: "var(--font-dm-mono)",
                    }}
                  >
                    {interruptTrigger === "paste_detected" ? "Integrity Check" : "Follow-up"}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {interrupt}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: "300px" }}>
            {transcript.map((entry, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-[10px] text-xs ${entry.role === "ai" ? "mr-4" : "ml-4"}`}
                style={{
                  background: entry.role === "ai" ? "var(--surface)" : "rgba(0,153,153,0.06)",
                  border: entry.type === "interrupt" ? "1px solid rgba(245,158,11,0.2)" : "1px solid var(--border)",
                  fontFamily: "var(--font-dm-sans)",
                  color: "var(--muted2)",
                }}
              >
                {entry.text.slice(0, 150)}
                {entry.text.length > 150 && "..."}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
