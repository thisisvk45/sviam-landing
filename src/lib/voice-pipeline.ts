/**
 * Voice Pipeline: AudioContext mic capture (16kHz PCM16) + gapless audio playback (24kHz).
 * Sends audio_in messages via existing WebSocket, receives audio_out for playback.
 */

/* ── Helpers ──────────────────────────────────────────────────── */

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const idx = Math.floor(i * ratio);
    result[i] = buffer[idx];
  }
  return result;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Process in 8KB chunks to avoid call stack overflow on large buffers
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 8192) {
    const slice = bytes.subarray(i, Math.min(i + 8192, bytes.length));
    chunks.push(String.fromCharCode(...slice));
  }
  return btoa(chunks.join(""));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer | null {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch {
    // Malformed base64 — return null so callers can skip
    return null;
  }
}

/* ── VoicePipeline class ─────────────────────────────────────── */

const PLAYBACK_SAMPLE_RATE = 24000; // Must match Cartesia output exactly

export class VoicePipeline {
  private ws: WebSocket;
  private captureCtx: AudioContext | null = null;
  private playbackCtx: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private capturing = false;
  private paused = false;
  private nextPlaybackTime = 0;
  private destroyed = false;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  /** Start capturing mic audio. Optionally reuse an existing MediaStream. */
  startCapture(existingStream?: MediaStream): void {
    if (this.destroyed || this.capturing) return;

    const stream = existingStream;
    if (!stream) return;

    // Use native sample rate, we'll downsample in the processor
    this.captureCtx = new AudioContext();
    const nativeRate = this.captureCtx.sampleRate;

    this.sourceNode = this.captureCtx.createMediaStreamSource(stream);
    // 4096 buffer = ~93ms at 44.1kHz — good balance of latency vs overhead
    this.scriptNode = this.captureCtx.createScriptProcessor(4096, 1, 1);

    this.scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
      if (this.paused || this.destroyed) return;
      if (this.ws.readyState !== WebSocket.OPEN) return;

      const input = e.inputBuffer.getChannelData(0);
      const downsampled = downsample(input, nativeRate, 16000);
      const pcm16 = float32ToInt16(downsampled);
      const b64 = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);

      this.ws.send(JSON.stringify({ type: "audio_in", data: b64 }));
    };

    this.sourceNode.connect(this.scriptNode);
    this.scriptNode.connect(this.captureCtx.destination); // required for processing
    this.capturing = true;
  }

  stopCapture(): void {
    this.capturing = false;
    this.scriptNode?.disconnect();
    this.sourceNode?.disconnect();
    this.scriptNode = null;
    this.sourceNode = null;
    this.captureCtx?.close().catch(() => {});
    this.captureCtx = null;
  }

  pauseCapture(): void {
    this.paused = true;
  }

  resumeCapture(): void {
    this.paused = false;
  }

  /** Handle ai_speaking_start — pause mic capture for echo cancellation. */
  handleSpeakingStart(): void {
    this.pauseCapture();
    // Reset playback timeline for new speech
    this.nextPlaybackTime = 0;
    // Ensure playback context exists at exact Cartesia sample rate
    if (!this.playbackCtx) {
      this.playbackCtx = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE });
    }
  }

  /** Handle ai_speaking_end — resume mic capture after short delay. */
  handleSpeakingEnd(): void {
    setTimeout(() => {
      if (!this.destroyed) this.resumeCapture();
    }, 300);
  }

  /** Handle incoming audio_out message — decode and schedule gapless playback. */
  handleAudioOut(base64Data: string): void {
    if (this.destroyed) return;
    if (!this.playbackCtx) {
      this.playbackCtx = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE });
    }

    const pcmBuffer = base64ToArrayBuffer(base64Data);
    if (!pcmBuffer) return; // Malformed base64 — skip this chunk

    const int16 = new Int16Array(pcmBuffer);
    if (int16.length === 0) return;

    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = this.playbackCtx.createBuffer(1, float32.length, PLAYBACK_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.playbackCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.playbackCtx.destination);

    const now = this.playbackCtx.currentTime;
    const startAt = Math.max(now, this.nextPlaybackTime);
    source.start(startAt);
    this.nextPlaybackTime = startAt + audioBuffer.duration;
  }

  /** Stop all playback immediately. */
  stopPlayback(): void {
    this.playbackCtx?.close().catch(() => {});
    this.playbackCtx = null;
    this.nextPlaybackTime = 0;
  }

  /** Tear down everything. */
  destroy(): void {
    this.destroyed = true;
    this.stopCapture();
    this.stopPlayback();
  }
}
