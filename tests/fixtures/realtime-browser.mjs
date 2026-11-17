export function realtimeBrowser() {
  const peers = [], audios = [], tracks = [];
  const track = { stopped: false, stop() { this.stopped = true; } }; tracks.push(track);
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  class Peer {
    connectionState = "new";
    constructor() { peers.push(this); }
    addTrack() {}
    createDataChannel() {
      this.channel = { readyState: "connecting", messages: [], send(raw) { this.messages.push(JSON.parse(raw)); }, close() { this.readyState = "closed"; }, emit(event) { this.onmessage?.({ data: JSON.stringify(event) }); } };
      return this.channel;
    }
    async createOffer() { return { type: "offer", sdp: "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n" }; }
    async setLocalDescription(offer) { this.localDescription = offer; }
    async setRemoteDescription() {
      this.ontrack?.({ streams: [stream] }); this.channel.readyState = "open"; this.channel.onopen?.();
    }
    close() { this.connectionState = "closed"; }
  }
  function audio() {
    const value = { autoplay: false, muted: false, paused: true, srcObject: null, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; }, remove() {} };
    audios.push(value); return value;
  }
  return { Peer, peers, audios, tracks, audio, devices: { getUserMedia: async () => stream } };
}
