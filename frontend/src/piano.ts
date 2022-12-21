import { audio } from './audio'
import { Dictionary } from './util'

export interface PianoControls {
    handleKeyDown(e: KeyboardEvent): void
    handleKeyUp(e: KeyboardEvent): void
    sustain: boolean
    loop: boolean
}

const noteByKeyMap: Dictionary<number> = {
    Q: 0, A: 1, Z: 2, W: 3, S: 4, X: 5, E: 6, D: 7, C: 8, R: 9, F: 10, V: 11, T: 12, G: 13, B: 14, Y: 15, H: 16, N: 17, U: 18, J: 19, M: 20, I: 21, K: 22, O: 23, L: 24, P: 25, ';': 26, '[': 27, '\'': 28, ']': 29, '\\': 30, ',': 31, '.': 32, '/': 33
}

class PianoControlsImpl implements PianoControls {
    private audioSources: audio.AudioBufferSourcePlayer[] = []
    private baseNoteOffset = -12
    sustain: boolean = false
    loop: boolean = true
    constructor(public instrument: AudioBuffer, public readonly audioContext: AudioContext, public readonly audioNode: AudioNode) {
        for (let i = 0; i < 24; i++) {
            let source = new audio.BasicAudioBufferSourcePlayer(this.audioContext, audio.cloneAudioBuffer(audioContext, this.instrument), audioNode)
            source.loopMode = this.loop
            source.detune(i + this.baseNoteOffset)
            this.audioSources.push(source)
        }
    }

    private playNote(note: number) {
        let source = this.audioSources[note % this.audioSources.length]
        source.play()
    }

    private stopNote(note: number) {
        let source = this.audioSources[note % this.audioSources.length]
        source.stop()
    }

    handleKeyDown(e: KeyboardEvent) {
        if (e.repeat) {
            return
        }
        let key = e.code
        if (key.startsWith('Key')) {
            key = key.substring(3)
        }
        if (key in noteByKeyMap) {
            this.playNote(noteByKeyMap[key])
        }
    }

    handleKeyUp(e: KeyboardEvent) {
        if (e.repeat) {
            return
        }
        let key = e.code
        if (key.startsWith('Key')) {
            key = key.substring(3)
        }
        if (key in noteByKeyMap) {
            this.stopNote(noteByKeyMap[key])
        }
    }
}

export function createPianoControls(instrument: AudioBuffer, audioContext: AudioContext, audioNode: AudioNode): PianoControls {
    return new PianoControlsImpl(instrument, audioContext, audioNode)
}