// Sound Manager for Shadow Runner - Uses Web Audio API for simple sound generation
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    // Initialize Web Audio API
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported, sounds disabled');
    }
  }

  private beep(frequency: number, duration: number, type: OscillatorType = 'sine', volume?: number) {
    if (!this.enabled || !this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    osc.frequency.value = frequency;
    osc.type = type;
    gainNode.gain.value = (volume !== undefined ? volume : this.volume) * 0.1;
    
    osc.start();
    osc.stop(this.audioContext.currentTime + duration / 1000);
  }

  play(name: string, volume?: number) {
    if (!this.enabled || !this.audioContext) return;
    
    switch (name) {
      case 'jump':
        this.beep(400, 50, 'sine', volume);
        break;
      case 'death':
        this.beep(200, 300, 'sawtooth', volume);
        setTimeout(() => this.beep(150, 200, 'sawtooth', volume), 100);
        break;
      case 'shadowSpawn':
        this.beep(150, 500, 'sawtooth', volume);
        setTimeout(() => this.beep(100, 300, 'sawtooth', volume), 200);
        break;
      case 'trap':
        this.beep(300, 100, 'square', volume);
        break;
      case 'victory':
        this.beep(523, 150, 'sine', volume);
        setTimeout(() => this.beep(659, 150, 'sine', volume), 150);
        setTimeout(() => this.beep(784, 300, 'sine', volume), 300);
        break;
      case 'land':
        this.beep(200, 30, 'sine', volume);
        break;
      case 'hit':
        this.beep(250, 80, 'square', volume);
        break;
      case 'bossAppear':
        this.beep(100, 800, 'sawtooth', volume);
        setTimeout(() => this.beep(80, 600, 'sawtooth', volume), 300);
        setTimeout(() => this.beep(60, 400, 'sawtooth', volume), 600);
        break;
      case 'levelComplete':
        this.beep(523, 100, 'sine', volume);
        setTimeout(() => this.beep(659, 100, 'sine', volume), 100);
        setTimeout(() => this.beep(784, 100, 'sine', volume), 200);
        setTimeout(() => this.beep(1047, 200, 'sine', volume), 300);
        break;
      default:
        break;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

export const soundManager = new SoundManager();
