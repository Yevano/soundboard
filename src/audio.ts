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
}