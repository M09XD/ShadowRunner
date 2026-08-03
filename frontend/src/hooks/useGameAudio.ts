import { useCallback, useRef, useEffect, useState } from 'react';

// Audio URLs - using free game audio from various sources
const AUDIO_SOURCES = {
  // Background music (using placeholder URLs - would be replaced with actual audio files)
  menuMusic: 'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3',
  gameplayMusic: 'https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3',
  battleMusic: 'https://assets.mixkit.co/music/preview/mixkit-epic-orchestra-transition-2290.mp3',
  
  // Sound effects
  jump: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  land: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  trapTrigger: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  shadowSpawn: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
  attack: 'https://assets.mixkit.co/active_storage/sfx/2576/2576-preview.mp3',
  victory: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  defeat: 'https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3',
  select: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  damage: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
};

type AudioType = keyof typeof AUDIO_SOURCES;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function useGameAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const sfxGainNodeRef = useRef<GainNode | null>(null);
  const currentMusicRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('shadowRunnerMuted');
    return saved === 'true';
  });
  const [masterVolume, setMasterVolume] = useState(() => {
    const saved = localStorage.getItem('shadowRunnerVolume');
    return saved ? parseFloat(saved) : 0.5;
  });
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('shadowRunnerMusicVolume');
    return saved ? parseFloat(saved) : 0.3;
  });
  const [sfxVolume, setSfxVolume] = useState(() => {
    const saved = localStorage.getItem('shadowRunnerSfxVolume');
    return saved ? parseFloat(saved) : 0.7;
  });

  // Initialize Web Audio API
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;
    
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext!)();
      
      // Create gain nodes for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      musicGainNodeRef.current = audioContextRef.current.createGain();
      sfxGainNodeRef.current = audioContextRef.current.createGain();
      
      // Connect nodes
      musicGainNodeRef.current.connect(gainNodeRef.current);
      sfxGainNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      // Set initial volumes
      gainNodeRef.current.gain.value = isMuted ? 0 : masterVolume;
      musicGainNodeRef.current.gain.value = musicVolume;
      sfxGainNodeRef.current.gain.value = sfxVolume;
    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error);
    }
  }, [isMuted, masterVolume, musicVolume, sfxVolume]);

  // Load audio buffer
  const loadAudio = useCallback(async (type: AudioType): Promise<AudioBuffer | null> => {
    if (!audioContextRef.current) return null;
    
    const cached = audioBuffersRef.current.get(type);
    if (cached) return cached;
    
    try {
      const response = await fetch(AUDIO_SOURCES[type]);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBuffersRef.current.set(type, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio: ${type}`, error);
      return null;
    }
  }, []);

  // Play sound effect
  const playSFX = useCallback(async (type: AudioType) => {
    if (!audioContextRef.current || !sfxGainNodeRef.current || isMuted) return;
    
    // Resume context if suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    const buffer = await loadAudio(type);
    if (!buffer) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(sfxGainNodeRef.current);
    source.start(0);
  }, [loadAudio, isMuted]);

  // Play background music
  const playMusic = useCallback(async (type: 'menuMusic' | 'gameplayMusic' | 'battleMusic') => {
    if (!audioContextRef.current || !musicGainNodeRef.current) return;
    
    // Resume context if suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    // Stop current music
    if (currentMusicRef.current) {
      try {
        currentMusicRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
    
    const buffer = await loadAudio(type);
    if (!buffer) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(musicGainNodeRef.current);
    source.start(0);
    currentMusicRef.current = source;
  }, [loadAudio]);

  // Stop music
  const stopMusic = useCallback(() => {
    if (currentMusicRef.current) {
      try {
        currentMusicRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      currentMusicRef.current = null;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newValue = !prev;
      localStorage.setItem('shadowRunnerMuted', String(newValue));
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = newValue ? 0 : masterVolume;
      }
      return newValue;
    });
  }, [masterVolume]);

  // Update master volume
  const updateMasterVolume = useCallback((volume: number) => {
    setMasterVolume(volume);
    localStorage.setItem('shadowRunnerVolume', String(volume));
    if (gainNodeRef.current && !isMuted) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [isMuted]);

  // Update music volume
  const updateMusicVolume = useCallback((volume: number) => {
    setMusicVolume(volume);
    localStorage.setItem('shadowRunnerMusicVolume', String(volume));
    if (musicGainNodeRef.current) {
      musicGainNodeRef.current.gain.value = volume;
    }
  }, []);

  // Update SFX volume
  const updateSfxVolume = useCallback((volume: number) => {
    setSfxVolume(volume);
    localStorage.setItem('shadowRunnerSfxVolume', String(volume));
    if (sfxGainNodeRef.current) {
      sfxGainNodeRef.current.gain.value = volume;
    }
  }, []);

  // Initialize on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopMusic]);

  return {
    isMuted,
    masterVolume,
    musicVolume,
    sfxVolume,
    toggleMute,
    updateMasterVolume,
    updateMusicVolume,
    updateSfxVolume,
    playSFX,
    playMusic,
    stopMusic,
    initAudio,
  };
}
