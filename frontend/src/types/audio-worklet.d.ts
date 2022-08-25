declare interface AudioWorkletProcessorImpl<T extends AudioWorkletProcessor> {
    new(): T
}

declare abstract class AudioWorkletProcessor {
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: { [string]: Float32Array }
    ): boolean
}

declare function registerProcessor<T extends AudioWorkletProcessor>(
    name: string, processor: AudioWorkletProcessorImpl<T>
): void

declare interface AudioParamMap extends Map<string, AudioParam> {
    // readonly size: number
}