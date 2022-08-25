export class MultiplyProcessor extends AudioWorkletProcessor {
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: { coefficient: Float32Array }
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
                outputChannel[i] = inputChannel[i] * parameters.coefficient[i]
            }
        }

        return false
    }

    static parameterDescriptors = [
        {
            name: 'coefficient'
        }
    ]
}

registerProcessor('multiply-processor', MultiplyProcessor)
