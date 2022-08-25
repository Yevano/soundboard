import { Dictionary } from "../util"

export class SignalMultiplier extends AudioWorkletProcessor {
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Dictionary<Float32Array>
    ): boolean {
        if (inputs.length === 0) {
            return false
        }

        const frameLength = 128
        const output = outputs[0]

        // Initialize output with the first input
        for (let channelIndex = 0; channelIndex < output.length; channelIndex++) {
            const outputChannel = output[channelIndex]
            const inputChannel = inputs[0][channelIndex]
            if (inputChannel === undefined) {
                continue
            }

            for (let i = 0; i < outputChannel.length; i++) {
                const sample = inputChannel[i]
                const noise = Math.random()
                outputChannel[i] = sample - sample * noise * 0.5
                // outputChannel[i] = Math.random()
            }
        }

        // Iteratively multiply the remaining input signals
        /* for (let inputIndex = 1; inputIndex < inputs.length; inputIndex++) {
            for (let channelIndex = 0; channelIndex < output.length; channelIndex++) {
                const outputChannel = output[channelIndex]
                const inputChannel = inputs[inputIndex][channelIndex]
                for (let i = 0; i < outputChannel.length; i++) {
                    outputChannel[i] *= inputChannel[i]
                }
            }
        } */

        return false
    }
}

registerProcessor('signal-multiplier-processor', SignalMultiplier)
