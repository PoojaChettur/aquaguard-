/**
 * AquaGuard — Web Audio Acoustic Sonar Ping & Tactical Audio Synthesizer
 */

class SonarAudioEffects {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio not supported:", e);
    }
  }

  playSonarPing() {
    if (this.isMuted) return;
    if (!this.audioCtx) this.init();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 1.2);
    } catch (e) {
      // Ignore audio autoplay restrictions
    }
  }

  playClick() {
    if (this.isMuted) return;
    if (!this.audioCtx) this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

window.SonarAudioEffects = SonarAudioEffects;
