function staticImplements<T>() {
    return <U extends T>(constructor: U) => {constructor};
}

declare interface AudioParamDescriptor {
    name: string
    automationRate?: 'a-rate' | 'k-rate'
    minValue?: number
    maxValue?: number
    defaultValue?: number
}

declare interface AudioWorkletProcessorImpl<T extends AudioWorkletProcessor> {
    new(): T
    parameterDescriptors?: AudioParamDescriptor[]
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

declare const currentFrame: number
declare const currentTime: number
declare const sampleRate: number