import { useEffect, useRef } from 'react'

type BlossomSoundNodes = {
  context: AudioContext
  source: AudioBufferSourceNode
  filter: BiquadFilterNode
  gain: GainNode
  flutter: OscillatorNode
}

export function useBlossomSound(isSoundOn: boolean) {
  const soundNodesRef = useRef<BlossomSoundNodes | null>(null)

  useEffect(() => {
    const startSound = async () => {
      if (typeof window === 'undefined') return
      const AudioContextClass =
        window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return

      if (!soundNodesRef.current) {
        const context = new AudioContextClass()
        const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
        const data = buffer.getChannelData(0)

        for (let i = 0; i < data.length; i += 1) {
          data[i] = (Math.random() * 2 - 1) * 0.15
        }

        const source = context.createBufferSource()
        source.buffer = buffer
        source.loop = true

        const filter = context.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1400

        const gain = context.createGain()
        gain.gain.value = 0.02

        const flutter = context.createOscillator()
        flutter.type = 'sine'
        flutter.frequency.value = 0.12

        const flutterGain = context.createGain()
        flutterGain.gain.value = 0.015

        flutter.connect(flutterGain)
        flutterGain.connect(gain.gain)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(context.destination)

        source.start()
        flutter.start()

        soundNodesRef.current = { context, source, filter, gain, flutter }
      }

      if (soundNodesRef.current?.context.state === 'suspended') {
        await soundNodesRef.current.context.resume()
      }
    }

    const stopSound = async () => {
      if (soundNodesRef.current?.context.state === 'running') {
        await soundNodesRef.current.context.suspend()
      }
    }

    if (isSoundOn) {
      void startSound()
    } else {
      void stopSound()
    }

    return () => {
      const nodes = soundNodesRef.current
      if (!nodes) return
      try {
        nodes.source.stop()
        nodes.flutter.stop()
      } catch {
        // Ignore stop errors if nodes already stopped.
      }
      void nodes.context.close()
      soundNodesRef.current = null
    }
  }, [isSoundOn])

  useEffect(() => {
    const handleVisibility = () => {
      if (!soundNodesRef.current) return
      if (document.visibilityState === 'hidden') {
        void soundNodesRef.current.context.suspend()
      } else if (isSoundOn) {
        void soundNodesRef.current.context.resume()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isSoundOn])
}
