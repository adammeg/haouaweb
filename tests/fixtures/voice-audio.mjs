export function webAudio() {
  const contexts = [], sources = [];
  class Context {
    state = "running"; currentTime = 0; destination = {};
    constructor() { contexts.push(this); }
    async resume() {}
    async close() { this.state = "closed"; }
    createBuffer(channels, length, rate) { const samples = new Float32Array(length); return { duration: length / rate, sampleRate: rate, getChannelData: () => samples }; }
    createBufferSource() {
      const source = { stopped: false, disconnected: false, connect() {}, start(at) { this.startAt = at; }, stop() { this.stopped = true; }, disconnect() { this.disconnected = true; }, end() { this.onended?.(); } };
      sources.push(source); return source;
    }
  }
  return { Context, contexts, sources };
}
