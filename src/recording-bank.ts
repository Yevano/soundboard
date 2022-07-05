import { audio } from "./audio"
import { dom } from "./dom"

export class Recorder extends audio.AudioBufferSourcePlayer {
    readonly mediaStreamDestination: MediaStreamAudioDestinationNode
    private mediaRecorder: MediaRecorder | undefined
    private audioBuffer: AudioBuffer
    loopMode: boolean = false
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
            this.audioBuffer = await this.audioContext.decodeAudioData(buffer)
            console.log('Data decoded')
        }
    }

    stopRecording() {
        if (this.mediaRecorder === undefined) {
            return
        }

        this.mediaRecorder.stop()
        this.currentlyRecording = false
    }

    getBuffer() {
        return this.audioBuffer
    }
}
