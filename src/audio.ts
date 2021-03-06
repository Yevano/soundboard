import { chunkFloat32, map, max } from "./util"

export namespace audio {
    export async function load(path: string, audioContext: AudioContext): Promise<AudioBuffer> {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest()
            request.open('GET', path)
            request.responseType = 'arraybuffer'

            request.onload = function(event) {
                audioContext.decodeAudioData(request.response, resolve, reject)
            }

            request.send()
        })
    }

    export function cloneAudioBuffer(context: AudioContext, buffer: AudioBuffer) {
        const newBuffer = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            buffer.copyFromChannel(newBuffer.getChannelData(i), i)
        }
        return newBuffer
    }

    export interface ReverbNodes {
        dryGain: GainNode
        delayNode: DelayNode
        wetGain: GainNode
    }

    export function connectReverb(context: AudioContext, input: AudioNode, output: AudioNode): ReverbNodes {
        const dryGain = context.createGain()
        input.connect(dryGain)
        dryGain.connect(output)
        dryGain.gain.value = 0.5

        const delayNode = context.createDelay()
        delayNode.delayTime.value = 0.1
        const wetGain = context.createGain()
        wetGain.gain.value = 0.5
        input.connect(delayNode)
        delayNode.connect(wetGain)
        wetGain.connect(delayNode)
        wetGain.connect(output)

        return {
            dryGain, delayNode, wetGain
        }
    }

    export interface AudioPlayer {
        play(): void
        stop(): void
        detune(pitchMultiplier: number): void
        getDuration(): number
        getElapsedTime(): number
        getOutput(): AudioNode
        get loopMode(): boolean
        set loopMode(mode: boolean)
        get currentlyPlaying(): boolean
    }

    export abstract class AudioBufferSourcePlayer implements AudioPlayer {
        currentlyPlaying: boolean = false
        startTime: number = 0
        private requestPlayAfterStop: boolean = false
        private audioSource: AudioBufferSourceNode | undefined
        private pitchMultiplier: number = 1
        protected readonly output: AudioNode
        private loopModeProp = false

        constructor(output: AudioNode) {
            this.output = output
        }

        get loopMode(): boolean {
            return this.loopModeProp
        }

        set loopMode(loopMode: boolean) {
            this.loopModeProp = loopMode
        }

        abstract getAudioContext(): AudioContext
        abstract getAudioBuffer(): AudioBuffer

        getOutput() {
            return this.output
        }
        
        play(): void {
            if (this.currentlyPlaying) {
                this.stop()
                this.requestPlayAfterStop = true
                return
            }
    
            this.startTime = this.getAudioContext().currentTime
            const newAudioSource = this.getAudioContext().createBufferSource()
            this.audioSource = newAudioSource
            this.audioSource.loop = this.loopMode
            this.detune(this.pitchMultiplier)
            this.audioSource.buffer = this.getAudioBuffer()
            this.audioSource.connect(this.output)
            this.audioSource.start(0)
            this.currentlyPlaying = true
    
            this.audioSource?.addEventListener('ended', event => {
                this.currentlyPlaying = false
                if (this.requestPlayAfterStop) {
                    this.play()
                    this.requestPlayAfterStop = false
                } 
            })
        }

        stop(): void {
            this.audioSource?.stop()
            this.audioSource = undefined
            this.currentlyPlaying = false
        }

        detune(pitchMultiplier: number) {
            this.pitchMultiplier = pitchMultiplier
            if(this.audioSource !== undefined) {
                this.audioSource.detune.value = Math.log2(this.pitchMultiplier) * 1200
            }
        }
    
        getDuration() {
            return this.getAudioBuffer().duration * this.pitchMultiplier
        }
    
        getElapsedTime() {
            if (!this.currentlyPlaying || this.audioSource === undefined) {
                return 0
            }
            let currentTime = this.getAudioContext().currentTime - this.startTime
            const duration = this.getDuration()
    
            if (this.audioSource.loop) {
                currentTime %= duration
            }
    
            return currentTime / duration
        }
    }

    export class AudioControl extends AudioBufferSourcePlayer {
        readonly buttonElement: HTMLButtonElement
        readonly audioContext: AudioContext
        readonly audioBuffer: AudioBuffer
        readonly category: string
        readonly name: string
    
        constructor(
            buttonElement: HTMLButtonElement,
            audioContext: AudioContext,
            audioBuffer: AudioBuffer,
            output: AudioNode,
            category: string,
            name: string,
        ) {
            super(output)
            this.buttonElement = buttonElement
            this.audioContext = audioContext
            this.audioBuffer = audioBuffer
            this.startTime = audioContext.currentTime
            this.category = category
            this.name = name
        }

        getAudioContext(): AudioContext {
            return this.audioContext
        }

        getAudioBuffer(): AudioBuffer {
            return this.audioBuffer
        }
    }

    export class AudioEffects {
        readonly inputNode: GainNode
        readonly preGainNode: GainNode
        readonly postGainNode: GainNode
        readonly reverbNodes: ReverbNodes

        constructor(readonly audioContext: AudioContext) {
            this.inputNode = audioContext.createGain()
            this.preGainNode = audioContext.createGain()
            this.postGainNode = audioContext.createGain()
            this.reverbNodes = connectReverb(audioContext, this.inputNode, this.preGainNode)
            this.preGainNode.connect(this.postGainNode)
        }

        setGain(value: number): void {
            this.postGainNode.gain.value = value
        }

        setReverb(dry: number, wet: number, delay: number): void {
            this.reverbNodes.dryGain.gain.value = dry
            this.reverbNodes.wetGain.gain.value = wet
            this.reverbNodes.delayNode.delayTime.value = delay
        }
    }

    export function modifyWaveformPower(buffer: Float32Array, target: number, subSampleLength: number) {
        const length = buffer.length
        // const power = waveformPower(buffer)
        const power = getPeakWaveformPower(buffer, subSampleLength)
        const powerRatio = target / power

        for (let i = 0; i < length; i++) {
            buffer[i] *= powerRatio
        }
    }

    export function getPeakWaveformPower(buffer: Float32Array, subSampleLength: number) {
        const chunkCount = Math.floor(buffer.length / subSampleLength)
        let peak = 0

        for (let i = 0; i < chunkCount; i++) {
            const power = getWaveformPower(buffer, subSampleLength * i, subSampleLength)

            if (power > peak) {
                peak = power
            }
        }

        return peak
    }

    export function getWaveformPower(buffer: Float32Array, offset: number, length: number) {
        let sum = 0
        let previousSample = 0
        const endOffset = offset + length
        for (let i = offset; i < endOffset; i++) {
            const sample = buffer[i]
            sum += Math.abs(sample - previousSample)
            previousSample = sample
        }
        return sum / length
    }

    export function normalize(buffer: Float32Array, targetLevel: number, windowLength: number) {
        const rms = getPeakRMS(buffer, targetLevel, 0, buffer.length, windowLength)
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] *= rms
        }
    }

    export function getPeakRMS(buffer: Float32Array, targetLevel: number, offset: number, length: number, windowLength: number) {
        if (windowLength > length - offset) {
            windowLength = length - offset
        }

        const r = 10 ** (targetLevel / 10)

        let sumSquares = 0
        
        for (let i = offset; i < offset + windowLength; i++) {
            sumSquares += buffer[i] ** 2
        }

        let peakSumSquares = sumSquares

        for (let slidingOffset = offset + 1; slidingOffset < length - windowLength; slidingOffset++) {
            sumSquares -= buffer[slidingOffset - 1] ** 2
            sumSquares += buffer[slidingOffset + windowLength] ** 2

            if (sumSquares > peakSumSquares) {
                peakSumSquares = sumSquares
            }
        }

        return Math.sqrt((windowLength * r ** 2) / peakSumSquares)
    }

    export function getRMS(buffer: Float32Array, targetLevel: number, offset: number, length: number) {
        const r = 10 ** (targetLevel / 10)
        return Math.sqrt((length * r ** 2) / sumOfSquares(buffer, offset, length))
    }

    export function sumOfSquares(buffer: Float32Array, offset: number, length: number) {
        let sum = 0
        const endOffset = offset + length
        for (let i = offset; i < endOffset; i++) {
            sum += buffer[i] ** 2
        }
        return sum
    }
}
