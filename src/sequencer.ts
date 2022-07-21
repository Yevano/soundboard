export interface Impulse {
    start(): void
    stop(): void
}

export class AudioImpulse implements Impulse {
    constructor(readonly audioContext: AudioContext, audioBuffer: AudioBuffer) {

    }

    start(): void {
        throw new Error("Method not implemented.");
    }

    stop(): void {
        throw new Error("Method not implemented.");
    }
}

export class ImpulsePattern {
    impulseTimings: ImpulseTiming[] = []


}

export class ImpulseTiming {
    constructor(readonly impulse: Impulse, readonly startDelay: number) { }
}

export class SequencePlayer {
    impulseTimings: ImpulseTiming[] = []
    currentIndex: number = 0

    push(impulse: Impulse, delay: number) {
        this.impulseTimings.push(new ImpulseTiming(impulse, delay))
    }

    start() {
        
    }
}

export class InstrumentKnob {

}

export class Instrument {

}
