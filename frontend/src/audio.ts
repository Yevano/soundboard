import { chunkFloat32, count, Dictionary, flatMap, flatten, map, max, product, relerp } from "./util"

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

    interface MultiplyParamMap extends AudioParamMap {
        get(key: string): AudioParam | undefined
        get(key: 'coefficient'): AudioParam
    }

    interface MultiplyNode extends AudioWorkletNode {
        parameters: MultiplyParamMap
    }

    function createMultiplyNode(context: AudioContext): MultiplyNode {
        return new AudioWorkletNode(context, 'multiply-processor') as MultiplyNode
    }

    interface ClipParamMap extends AudioParamMap {
        get(key: string): AudioParam | undefined
        get(key: 'cutoff'): AudioParam
    }

    interface ClipNode extends AudioWorkletNode {
        parameters: ClipParamMap
    }

    function createClipNode(context: AudioContext): ClipNode {
        return new AudioWorkletNode(context, 'clip-processor') as ClipNode
    }

    interface DistortionParamMap extends AudioParamMap {
        get(key: string): AudioParam | undefined
        get(key: 'preGain'): AudioParam
        get(key: 'postGain'): AudioParam
        get(key: 'cutoff'): AudioParam
    }

    interface DistortionNode extends AudioWorkletNode {
        parameters: DistortionParamMap
    }

    function createDistortionNode(context: AudioContext): DistortionNode {
        return new AudioWorkletNode(context, 'distortion-processor') as DistortionNode
    }

    export class FeedbackCombFilter {
        readonly inputNode: AudioNode
        readonly outputNode: AudioNode
        readonly delayTime: AudioParam
        readonly feedbackCoefficient: AudioParam
        readonly outputCoefficient: AudioParam

        constructor(context: AudioContext) {
            const inputAddNode = context.createGain()
            const delayNode = context.createDelay()
            const feedbackMultiplyNode = createMultiplyNode(context)
            const outputMultiplyNode = createMultiplyNode(context)
            this.inputNode = inputAddNode
            this.outputNode = outputMultiplyNode

            this.delayTime = delayNode.delayTime
            this.feedbackCoefficient = feedbackMultiplyNode.parameters.get('coefficient')!
            this.outputCoefficient = outputMultiplyNode.parameters.get('coefficient')!

            inputAddNode.connect(delayNode)
            inputAddNode.connect(outputMultiplyNode)
            delayNode.connect(feedbackMultiplyNode)
            feedbackMultiplyNode.connect(inputAddNode)
        }
    }

    export class LPFeedbackCombFilter {
        readonly inputNode: AudioNode
        readonly outputNode: AudioNode
        readonly delayTime: AudioParam
        readonly feedbackCoefficient: AudioParam
        readonly outputCoefficient: AudioParam
        readonly frequency: AudioParam

        constructor(context: AudioContext) {
            const inputAddNode = context.createGain()
            const delayNode = context.createDelay()
            const feedbackMultiplyNode = createMultiplyNode(context)
            const outputMultiplyNode = createMultiplyNode(context)
            const lowPassNode = context.createBiquadFilter()
            this.inputNode = inputAddNode
            this.outputNode = outputMultiplyNode
            
            lowPassNode.type = 'lowpass'
            this.frequency = lowPassNode.frequency
            this.delayTime = delayNode.delayTime
            this.feedbackCoefficient = feedbackMultiplyNode.parameters.get('coefficient')!
            this.outputCoefficient = outputMultiplyNode.parameters.get('coefficient')!

            inputAddNode.connect(delayNode)
            inputAddNode.connect(outputMultiplyNode)
            delayNode.connect(lowPassNode)
            lowPassNode.connect(feedbackMultiplyNode)
            feedbackMultiplyNode.connect(inputAddNode)
        }
    }

    export class SchroederAllPass {
        readonly inputNode: GainNode
        readonly outputNode: GainNode
        readonly delayTime: AudioParam
        readonly coefficient: AudioParam

        constructor(context: AudioContext) {
            this.inputNode = context.createGain()
            this.outputNode = context.createGain()
            const passThroughMultiplyNode = createMultiplyNode(context)
            const repeatMultiplyNode = createMultiplyNode(context)
            const negateNode = createMultiplyNode(context)
            const coefficientNode = context.createConstantSource()
            coefficientNode.start()
            const delayNode = context.createDelay()
            
            this.delayTime = delayNode.delayTime
            this.coefficient = coefficientNode.offset
            negateNode.parameters.get('coefficient').value = -1

            coefficientNode.connect(negateNode)
            coefficientNode.connect(repeatMultiplyNode.parameters.get('coefficient'))
            negateNode.connect(passThroughMultiplyNode.parameters.get('coefficient'))
            this.inputNode.connect(delayNode)
            this.inputNode.connect(passThroughMultiplyNode)
            passThroughMultiplyNode.connect(this.outputNode)
            repeatMultiplyNode.connect(this.inputNode)
            delayNode.connect(this.outputNode)
            delayNode.connect(repeatMultiplyNode)
        }
    }

    export class SchroederReverberator {
        readonly inputNode: AudioNode
        readonly reverbTime: AudioParam
        readonly feedbackGain: AudioParam
        readonly outA: AudioNode
        readonly outB: MultiplyNode
        readonly outC: MultiplyNode
        readonly outD: AudioNode

        constructor(context: AudioContext) {
            const { sampleRate } = context
            
            const ap1 = new SchroederAllPass(context)
            const ap2 = new SchroederAllPass(context)
            const ap3 = new SchroederAllPass(context)

            const fbcf1 = new FeedbackCombFilter(context)
            const fbcf2 = new FeedbackCombFilter(context)
            const fbcf3 = new FeedbackCombFilter(context)
            const fbcf4 = new FeedbackCombFilter(context)

            const s1 = context.createGain()
            const s2 = context.createGain()
            const negateS2 = createMultiplyNode(context)

            const lowPassNode = context.createBiquadFilter()
            const reverbTimeNode = context.createConstantSource()
            this.reverbTime = reverbTimeNode.offset
            reverbTimeNode.start()
            const allPassFeedbackNode = context.createConstantSource()
            this.feedbackGain = allPassFeedbackNode.offset
            allPassFeedbackNode.start()

            const allPassFeedbackMultiplyNode = createMultiplyNode(context)
             allPassFeedbackMultiplyNode.parameters.get('coefficient')

            this.outA = context.createGain()
            this.outB = createMultiplyNode(context)
            this.outC = createMultiplyNode(context)
            this.outD = context.createGain()

            ap1.coefficient.value = 0.7
            ap1.delayTime.value = 347 / sampleRate
            ap2.coefficient.value = 0.7
            ap2.delayTime.value = 113 / sampleRate
            ap3.coefficient.value = 0.7
            ap3.delayTime.value = 37 / sampleRate

            fbcf1.delayTime.value = 1687 / sampleRate
            fbcf1.outputCoefficient.value = 1
            fbcf1.feedbackCoefficient.value = 0.773
            fbcf2.delayTime.value = 1601 / sampleRate
            fbcf2.outputCoefficient.value = 1
            fbcf2.feedbackCoefficient.value = 0.802
            fbcf3.delayTime.value = 2053 / sampleRate
            fbcf3.outputCoefficient.value = 1
            fbcf3.feedbackCoefficient.value = 0.753
            fbcf4.delayTime.value = 2251 / sampleRate
            fbcf4.outputCoefficient.value = 1
            fbcf4.feedbackCoefficient.value = 0.733

            negateS2.parameters.get('coefficient').value = -1

            this.outB.parameters.get('coefficient').value = -1
            this.outC.parameters.get('coefficient').value = -1

            lowPassNode.type = 'lowpass'
            lowPassNode.frequency.value = 500

            ap1.outputNode.connect(ap2.inputNode)
            ap2.outputNode.connect(ap3.inputNode)
            lowPassNode.connect(fbcf1.inputNode)
            lowPassNode.connect(fbcf2.inputNode)
            lowPassNode.connect(fbcf3.inputNode)
            lowPassNode.connect(fbcf4.inputNode)

            ap3.outputNode.connect(lowPassNode)

            fbcf1.outputNode.connect(s1)
            fbcf3.outputNode.connect(s1)
            fbcf2.outputNode.connect(s2)
            fbcf4.outputNode.connect(s2)

            s1.connect(this.outA)
            s2.connect(this.outA)
            this.outA.connect(this.outB)
            this.outD.connect(this.outC)
            s1.connect(this.outD)
            negateS2.connect(this.outD)
            
            this.inputNode = ap1.inputNode
        }
    }

    export class LPSchroederReverberator {
        readonly inputNode: AudioNode
        readonly reverbTime: AudioParam
        readonly feedbackGain: AudioParam
        // readonly delayMultiplier: AudioParam
        readonly outA: AudioNode
        readonly outB: MultiplyNode
        readonly outC: MultiplyNode
        readonly outD: AudioNode

        constructor(context: AudioContext) {
            const { sampleRate } = context
            
            const ap1 = new SchroederAllPass(context)
            const ap2 = new SchroederAllPass(context)
            const ap3 = new SchroederAllPass(context)

            const fbcf1 = new LPFeedbackCombFilter(context)
            const fbcf2 = new LPFeedbackCombFilter(context)
            const fbcf3 = new LPFeedbackCombFilter(context)
            const fbcf4 = new LPFeedbackCombFilter(context)

            const s1 = context.createGain()
            const s2 = context.createGain()
            const negateS2 = createMultiplyNode(context)

            const reverbTimeNode = context.createConstantSource()
            const feedbackGainNode = context.createConstantSource()
            reverbTimeNode.start()
            feedbackGainNode.start()
            this.feedbackGain = feedbackGainNode.offset

            this.reverbTime = reverbTimeNode.offset

            this.outA = context.createGain()
            this.outB = createMultiplyNode(context)
            this.outC = createMultiplyNode(context)
            this.outD = context.createGain()

            ap1.coefficient.value = 0.7
            ap1.delayTime.value = 347 / sampleRate
            ap2.coefficient.value = 0.7
            ap2.delayTime.value = 113 / sampleRate
            ap3.coefficient.value = 0.7
            ap3.delayTime.value = 37 / sampleRate

            fbcf1.delayTime.value = 1687 / sampleRate
            fbcf1.outputCoefficient.value = 1
            fbcf1.feedbackCoefficient.value = 0.773
            fbcf1.frequency.value = 1000
            fbcf2.delayTime.value = 1601 / sampleRate
            fbcf2.outputCoefficient.value = 1
            fbcf2.feedbackCoefficient.value = 0.802
            fbcf2.frequency.value = 1000
            fbcf3.delayTime.value = 2053 / sampleRate
            fbcf3.outputCoefficient.value = 1
            fbcf3.feedbackCoefficient.value = 0.753
            fbcf3.frequency.value = 1000
            fbcf4.delayTime.value = 2251 / sampleRate
            fbcf4.outputCoefficient.value = 1
            fbcf4.feedbackCoefficient.value = 0.733
            fbcf4.frequency.value = 1000

            negateS2.parameters.get('coefficient').value = -1

            this.outB.parameters.get('coefficient').value = -1
            this.outC.parameters.get('coefficient').value = -1

            // feedbackGainNode.connect(ap1.coefficient)
            // feedbackGainNode.connect(ap2.coefficient)
            // feedbackGainNode.connect(ap3.coefficient)

            ap1.outputNode.connect(ap2.inputNode)
            ap2.outputNode.connect(ap3.inputNode)
            ap3.outputNode.connect(fbcf1.inputNode)
            ap3.outputNode.connect(fbcf2.inputNode)
            ap3.outputNode.connect(fbcf3.inputNode)
            ap3.outputNode.connect(fbcf4.inputNode)

            fbcf1.outputNode.connect(s1)
            fbcf3.outputNode.connect(s1)
            fbcf2.outputNode.connect(s2)
            fbcf4.outputNode.connect(s2)

            s1.connect(this.outA)
            s2.connect(this.outA)
            this.outA.connect(this.outB)
            this.outD.connect(this.outC)
            s1.connect(this.outD)
            negateS2.connect(this.outD)
            
            this.inputNode = ap1.inputNode
            // this.inputNode.connect(this.outA)
        }
    }

    export class SchroederReverb {
        readonly inputNode: GainNode
        readonly outputNode: GainNode
        readonly dryGain: AudioParam
        readonly wetGain: AudioParam

        constructor(context: AudioContext) {
            this.inputNode = context.createGain()
            this.outputNode = context.createGain()
            const dryGainNode = context.createGain()
            const wetGainNode = context.createGain()
            const reverberator = new SchroederReverberator(context)
            reverberator.feedbackGain.value = 0.9
            reverberator.reverbTime.value = 0.5
            const merger = context.createChannelMerger(4)

            this.dryGain = dryGainNode.gain
            this.wetGain = wetGainNode.gain

            this.inputNode.connect(dryGainNode)
            this.inputNode.connect(wetGainNode)
            dryGainNode.connect(this.outputNode)
            wetGainNode.connect(reverberator.inputNode)
            reverberator.outA.connect(merger, 0, 0)
            reverberator.outB.connect(merger, 0, 1)
            reverberator.outC.connect(merger, 0, 0)
            reverberator.outD.connect(merger, 0, 1)
            merger.connect(this.outputNode)
        }
    }

    export class LPSchroederReverb {
        readonly inputNode: GainNode
        readonly outputNode: GainNode
        readonly dryGain: AudioParam
        readonly wetGain: AudioParam

        constructor(context: AudioContext) {
            this.inputNode = context.createGain()
            this.outputNode = context.createGain()
            const dryGainNode = context.createGain()
            const wetGainNode = context.createGain()
            const reverberator = new LPSchroederReverberator(context)
            const merger = context.createChannelMerger(4)

            this.dryGain = dryGainNode.gain
            this.wetGain = wetGainNode.gain

            reverberator.feedbackGain.value = 0.7
            this.inputNode.connect(dryGainNode)
            this.inputNode.connect(wetGainNode)
            dryGainNode.connect(this.outputNode)
            wetGainNode.connect(reverberator.inputNode)
            reverberator.outA.connect(merger, 0, 0)
            reverberator.outB.connect(merger, 0, 1)
            reverberator.outC.connect(merger, 0, 0)
            reverberator.outD.connect(merger, 0, 1)
            merger.connect(this.outputNode)
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
        private audioBuffer: AudioBuffer
        private audioInitialized = false
        readonly category: string
        readonly name: string

        constructor(
            buttonElement: HTMLButtonElement,
            audioContext: AudioContext,
            output: AudioNode,
            category: string,
            name: string,
        ) {
            super(output)
            this.buttonElement = buttonElement
            this.audioContext = audioContext
            this.audioBuffer = audioContext.createBuffer(2, 1, 44100)
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

        setAudioBuffer(audioBuffer: AudioBuffer) {
            this.audioInitialized = true
            this.audioBuffer = audioBuffer
        }

        isAudioInitialized() {
            return this.audioInitialized
        }
    }

    export class AudioEffects {
        readonly inputNode: GainNode
        readonly preGain: AudioParam
        readonly postGain: AudioParam
        readonly preGainNode: AudioNode
        readonly postGainNode: AudioNode
        readonly reverb: SchroederReverb

        readonly distortionPreGain: AudioParam
        readonly distortionPostGain: AudioParam
        readonly distortionCutoff: AudioParam

        constructor(readonly context: AudioContext) {
            this.inputNode = context.createGain()
            const preGainNode = context.createGain()
            const postGainNode = context.createGain()
            this.reverb = new SchroederReverb(context)
            const distortionNode = createDistortionNode(context)

            this.preGain = preGainNode.gain
            this.postGain = postGainNode.gain
            this.distortionPreGain = distortionNode.parameters.get('preGain')
            this.distortionPostGain = distortionNode.parameters.get('postGain')
            this.distortionCutoff = distortionNode.parameters.get('cutoff')

            this.inputNode.connect(distortionNode)
            distortionNode.connect(this.reverb.inputNode)
            this.reverb.outputNode.connect(preGainNode)
            preGainNode.connect(postGainNode)

            this.preGainNode = preGainNode
            this.postGainNode = postGainNode
        }

        setGain(value: number): void {
            this.postGain.value = value
        }

        setReverb(dry: number, wet: number): void {
            this.reverb.dryGain.value = dry
            this.reverb.wetGain.value = wet
        }

        setDankness(dankness: number) {
            this.distortionPreGain.value = relerp(0, 1, 1, 100, dankness)
            this.distortionPostGain.value = dankness == 0 ? 1 : 0.3
            this.distortionCutoff.value = 2
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
