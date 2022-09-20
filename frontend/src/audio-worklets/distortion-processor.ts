export class DistortionProcessor extends AudioWorkletProcessor {
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: { preGain: Float32Array, postGain: Float32Array, cutoff: Float32Array }
    ): boolean {
        if (inputs.length === 0 || outputs.length === 0) {
            return false
        }

        const input = inputs[0]
        const output = outputs[0]

        for (let channelIndex = 0; channelIndex < input.length; channelIndex++) {
            const inputChannel = input[channelIndex]
            const outputChannel = output[channelIndex]

            for (let i = 0; i < inputChannel.length; i++) {
                const sample = inputChannel[i]
                const preGain = parameters.preGain[i]
                const postGain = parameters.postGain[i]
                const cutoff = parameters.cutoff[i]
                let amplified = sample * preGain
                if (Math.abs(amplified) > cutoff) {
                    amplified = Math.sign(amplified) * cutoff
                }
                outputChannel[i] = amplified * postGain
            }
        }

        return false
    }

    static parameterDescriptors = [
        {
            name: 'preGain'
        },
        {
            name: 'postGain'
        },
        {
            name: 'cutoff'
        },
    ]
}

registerProcessor('distortion-processor', DistortionProcessor)
