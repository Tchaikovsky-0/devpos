// =============================================================================
// AlertSound - 告警声音服务
// =============================================================================
// 使用 Web Audio API 生成不同级别的告警提示音。
// 支持静音切换、音量调节、不同告警级别不同音调。
// =============================================================================

type AlertSoundLevel = 'P0' | 'P1' | 'P2' | 'P3';

interface AlertSoundConfig {
  /** 是否静音，默认 false */
  muted: boolean;
  /** 音量 0-1，默认 0.5 */
  volume: number;
}

// 音调配置：频率(Hz) x 持续时间(ms) x 重复次数
const LEVEL_SOUNDS: Record<AlertSoundLevel, { freq: number; duration: number; repeat: number }> = {
  P0: { freq: 880, duration: 200, repeat: 3 },  // 高频短促 x3（紧急）
  P1: { freq: 660, duration: 300, repeat: 2 },  // 中频 x2（重要）
  P2: { freq: 440, duration: 400, repeat: 1 },  // 低频 x1（警告）
  P3: { freq: 330, duration: 500, repeat: 1 },  // 低频长 x1（提示）
};

class AlertSoundService {
  private audioCtx: AudioContext | null = null;
  private config: AlertSoundConfig = {
    muted: false,
    volume: 0.5,
  };

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /** 播放指定级别的告警音 */
  play(level: AlertSoundLevel): void {
    if (this.config.muted) return;

    const ctx = this.getContext();
    const sound = LEVEL_SOUNDS[level];
    const gainNode = ctx.createGain();
    gainNode.gain.value = this.config.volume;
    gainNode.connect(ctx.destination);

    for (let i = 0; i < sound.repeat; i++) {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = sound.freq;

      const startTime = ctx.currentTime + i * (sound.duration / 1000 + 0.1);

      // Envelope: fade in/out
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(this.config.volume, startTime + 0.02);
      noteGain.gain.linearRampToValueAtTime(
        0,
        startTime + sound.duration / 1000,
      );

      oscillator.connect(noteGain);
      noteGain.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + sound.duration / 1000);
    }
  }

  /** 播放检测发现提示音（短促单音） */
  playDetection(): void {
    if (this.config.muted) return;

    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 520;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.config.volume * 0.3, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  /** 设置静音 */
  setMuted(muted: boolean): void {
    this.config.muted = muted;
  }

  /** 获取静音状态 */
  get isMuted(): boolean {
    return this.config.muted;
  }

  /** 设置音量 */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  /** 获取音量 */
  get volume(): number {
    return this.config.volume;
  }
}

// Singleton
export const alertSoundService = new AlertSoundService();
export default alertSoundService;
