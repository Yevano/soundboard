import { normalize_audio } from "soundboard-wasm"
import { audio } from "./audio"
import { drawWaveform } from "./canvas"
import { getRecordingEntries, setRecordingEntries } from "./store"
import { count, doAsync, map } from "./util"
import { getAudioBuffer, putAudio, putEncodedAudio } from "./webapi"

export class Recorder extends audio.AudioBufferSourcePlayer {
    readonly mediaStreamDestination: MediaStreamAudioDestinationNode
    private mediaRecorder: MediaRecorder | undefined
    private audioBuffer: AudioBuffer
    currentlyRecording: boolean = false
    private waveformImage: HTMLImageElement | undefined

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

    private updateAudioBuffer(audioBuffer: AudioBuffer) {
        this.audioBuffer = audioBuffer
        this.trimStart()
        audioBuffer = this.audioBuffer
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            const buffer = audioBuffer.getChannelData(i)
            const sampleDuration = 0.1
            const targetVolume = 0
            normalize_audio(buffer, targetVolume, audioBuffer.sampleRate * sampleDuration)
        }
        this.setWaveformImage()
    }

    recordStream(mediaStream: MediaStream) {
        this.currentlyRecording = true
        this.mediaRecorder = new MediaRecorder(mediaStream)
        this.mediaRecorder.start()

        this.mediaRecorder.ondataavailable = async (event) => {
            console.log('Got data from recorder')
            const buffer = await event.data.arrayBuffer()
            const response = await putEncodedAudio(`recording-${this.index}`, buffer)
            this.updateAudioBuffer(await this.audioContext.decodeAudioData(buffer))

            const entries = getRecordingEntries()
            const { fileName } = response
            entries[this.index] = {
                displayName: '',
                fileName: fileName!,
            }
            setRecordingEntries(entries)
        }
    }

    record() {
        this.recordStream(this.mediaStreamDestination.stream)
    }

    stopRecording() {
        if (this.mediaRecorder === undefined) {
            return
        }

        this.mediaRecorder.stop()
        this.currentlyRecording = false
    }

    loadFile(fileName: string) {
        doAsync(async () => {
            this.updateAudioBuffer(await getAudioBuffer(fileName, this.audioContext))
        })
    }

    setWaveformImage() {
        doAsync(async () => {
            const waveform = this.audioBuffer.getChannelData(0)
            const imageBlob = await drawWaveform(waveform)

            const url = URL.createObjectURL(imageBlob)
            const imageElement = new Image()
            imageElement.style.position = 'absolute'
            imageElement.style.left = '0'
            imageElement.style.top = '0'
            imageElement.style.width = '100%'
            imageElement.style.height = '100%'
            imageElement.style.order = '0'

            imageElement.src = url

            if (this.waveformImage) {
                this.waveformImage.remove()
            }

            this.waveformImage = imageElement
            this.buttonElement.insertBefore(imageElement, this.buttonElement.firstChild)
        })
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

        if (startOffset === 0) {
            return
        }

        startOffset--

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
