import { audio } from "./audio"
import { count, map } from "./util"
import { putAudio, putEncodedAudio } from "./webapi"

export class Recorder extends audio.AudioBufferSourcePlayer {
    readonly mediaStreamDestination: MediaStreamAudioDestinationNode
    private mediaRecorder: MediaRecorder | undefined
    private audioBuffer: AudioBuffer
    currentlyRecording: boolean = false

    constructor(
        readonly buttonElement: HTMLButtonElement,
        readonly index: number,
        readonly audioContext: AudioContext,
        readonly input: AudioNode,
        output: AudioNode,
    ) {
        super(output)
        this.mediaStreamDestination = this.audioContext.createMediaStreamDestination()
        this.input.connect(this.mediaStreamDestination)
        this.audioBuffer = audioContext.createBuffer(2, 1, 44100)
    }

    getAudioContext(): AudioContext {
        return this.audioContext
    }
    
    getLoopMode(): boolean {
        return this.loopMode
    }

    getAudioBuffer(): AudioBuffer {
        return this.audioBuffer
    }

    record() {
        this.currentlyRecording = true
        this.mediaRecorder = new MediaRecorder(this.mediaStreamDestination.stream)
        this.mediaRecorder.start()

        this.mediaRecorder.ondataavailable = async (event) => {
            console.log('Got data from recorder')
            const buffer = await event.data.arrayBuffer()
            const response = await putEncodedAudio(`recording-${this.index}`, buffer)
            this.audioBuffer = await this.audioContext.decodeAudioData(buffer)
            console.log(response)
            this.trimStart()
        }
    }

    stopRecording() {
        if (this.mediaRecorder === undefined) {
            return
        }

        this.mediaRecorder.stop()
        this.currentlyRecording = false
    }

    private trimStart() {
        const channelCount = this.audioBuffer.numberOfChannels
        const buffers = Array.from(map(count(channelCount), this.audioBuffer.getChannelData.bind(this.audioBuffer)))
        const length = this.audioBuffer.length

        let startOffset
        loop:
        for (startOffset = 0; startOffset < length; startOffset++) {
            for (const buffer of buffers) {
                if (Math.abs(buffer[startOffset]) > 1e-20) {
                    console.log(buffer[startOffset - 1])
                    break loop
                }
            }
        }

        if (startOffset !== 0) {
            startOffset--
        }

        console.log(`${startOffset} / ${length}`)
        const newBufferLength = length - startOffset

        const newAudioBuffer = this.audioContext.createBuffer(channelCount, newBufferLength, this.audioBuffer.sampleRate)
        
        for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
            const newBuffer = newAudioBuffer.getChannelData(channelIndex)
            this.audioBuffer.copyFromChannel(newBuffer, channelIndex, startOffset)
        }

        this.audioBuffer = newAudioBuffer
    }

    getBuffer() {
        return this.audioBuffer
    }
}
