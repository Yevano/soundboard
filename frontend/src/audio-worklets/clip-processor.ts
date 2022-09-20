export class ClipProcessor extends AudioWorkletProcessor {
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: { cutoff: Float32Array }
    ): boolean {
        if (outputs.length === 0) {
            return false
        }

        if (inputs.length === 0) {
            for (const c of outputs[0]) {
                c.fill(0)
            }
            return false
        }

        const input = inputs[0]
        const output = outputs[0]

        for (let channelIndex = 0; channelIndex < input.length; channelIndex++) {
            const inputChannel = input[channelIndex]
            const outputChannel = output[channelIndex]

            for (let i = 0; i < inputChannel.length; i++) {
                var di = inputChannel[i]
                var ci = parameters.cutoff[i]
                outputChannel[i] = di > ci ? ci : di < -ci ? ci : di
            }
        }

        return false
    }

    static parameterDescriptors = [
        {
            name: 'cutoff'
        }
    ]
}

registerProcessor('clip-processor', ClipProcessor)
