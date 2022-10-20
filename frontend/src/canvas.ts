import { relerp } from "./util"

export abstract class GUICanvas {
    readonly drawContext: CanvasRenderingContext2D

    constructor(readonly canvasElement: HTMLCanvasElement) {
        this.drawContext = canvasElement.getContext('2d')!

        const loop = (time: number) => {
            this.canvasElement.width = window.visualViewport!.width
            this.canvasElement.height = 600
            this.draw(time)
            requestAnimationFrame(loop)
        }

        requestAnimationFrame(loop)
    }

    protected abstract draw(time: number): void
}

function sampleWaveform(waveform: Float32Array, x: number) {
    const waveformOffset = relerp(0, 1, 0, waveform.length, x)
    const i = Math.floor(waveformOffset)
    return waveform[i]
}

/* export class WaveformCanvas {
    private readonly canvasElement: OffscreenCanvas
    private readonly context: OffscreenCanvasRenderingContext2D
    private drawing = false

    constructor() {
        this.canvasElement = new OffscreenCanvas(200, 200)
        this.context = this.canvasElement.getContext('2d')!
    }

    
}
 */

export async function drawWaveform(waveform: Float32Array): Promise<Blob> {
    const canvas = new OffscreenCanvas(200, 200)
    const context = canvas.getContext('2d')!

    const ctx = context
    const w = canvas.width
    const h = canvas.height
    const di = 1 / w

    ctx.beginPath()

    ctx.moveTo(0, h / 2)

    for (let i = 0; i < 1; i += di) {
        const s = sampleWaveform(waveform, i) * 0.5
        const x = i * w
        const y = relerp(-1, 1, 0, h, s)
        ctx.lineTo(x, y)
    }

    ctx.lineWidth = 2
    ctx.strokeStyle = '#000000'
    ctx.stroke()

    const blob = await canvas.convertToBlob()
    return blob
}