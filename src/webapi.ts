import { PutFileResponse, ListAudioResponse } from './webapi-types'

const apiURL = 'http://localhost:8081'

export async function getAudioList() {
    const response = await fetch(`${apiURL}/list-audio`, { mode: 'cors' })
    return await response.json() as ListAudioResponse
}

export async function getAudioBuffer(name: string, audioContext: AudioContext) {
    const response = await fetch(`${apiURL}/get-audio/${name}`, { mode: 'cors' })
    const arrayBuffer = await response.arrayBuffer()
    return audioContext.decodeAudioData(arrayBuffer)
}

export async function putEncodedAudio(name: string, buffer: ArrayBuffer) {
    const fileBlob = new Blob([buffer], { type: 'audio/ogg; codecs=opus' })

    const formData = new FormData()
    formData.append('recording', fileBlob)
    formData.append('name', name)

    const response = await fetch(`${apiURL}/put-audio/${name}`, {
        mode: 'cors',
        method: 'POST',
        body: formData,
    })

    return await response.json() as PutFileResponse
}

export async function putAudioFile(name: string, file: File) {
    // const fileBlob = new Blob([buffer], { type: 'audio/ogg; codecs=opus' })
    const fileBlob = new Blob([await file.arrayBuffer()], { type: 'audio/ogg; codecs=opus' })

    const formData = new FormData()
    formData.append('recording', fileBlob)
    formData.append('name', name)

    const response = await fetch(`${apiURL}/put-audio/${name}`, {
        mode: 'cors',
        method: 'POST',
        body: formData,
    })

    return await response.json() as PutFileResponse
}

export async function putAudio(name: string, audioBuffer: AudioBuffer, audioContext: AudioContext) {
    const fileChunks = await new Promise<BlobPart[]>((resolve, reject) => {
        console.log('Start recording audio buffer to MediaStream')

        const mediaStreamDestination = audioContext.createMediaStreamDestination()
        const recorder = new MediaRecorder(mediaStreamDestination.stream)
        const bufferSource = audioContext.createBufferSource()
        bufferSource.buffer = audioBuffer
        bufferSource.playbackRate.value = bufferSource.playbackRate.maxValue
        bufferSource.connect(mediaStreamDestination)

        const chunks: BlobPart[] = []
        
        recorder.ondataavailable = e => {
            console.log('pushing chunk')
            chunks.push(e.data)
        }

        bufferSource.onended = e => {
            console.log('buffer finished')
            recorder.stop()
        }

        recorder.onstop = e => {
            console.log('recorder stopped')
            resolve(chunks)
        }

        bufferSource.start()
        recorder.start()
    })

    const fileBlob = new Blob(fileChunks)

    return await putEncodedAudio(name, await fileBlob.arrayBuffer())
}
