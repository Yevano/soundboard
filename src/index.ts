import { audio } from "./audio"
import { dom } from "./dom"
import { Dictionary, sleep } from "./util"

const audioFiles: Dictionary<string[]> = {
    'SFX': [
        'Laugh Track',
        'Windows 95 Error',
        'Gun shot 1',
        'Machine gun 1',
        'Police Siren 1',
        'Police Siren 2',
        'GBA',
        'Noot',
        'Body Reported',
        'Emergency Meeting',
        'smash',
        'bark4me'
    ],

    'Music': [
        'Bet on it',
        'Michaels birthday',
        'How could this happen to me',
        'Please end my suffering',
        'E',
        'Lets do the fork in the garbage disposal',
        'STOP',
        'I have so far to go',
        'Clubbed to death',
        'Monster Mashturbate',
        'Crazy Bong',
    ],

    'Memes': [
        'Thanks Obama',
        'OBAMNA',
        'Among Us',
        'Nice',
        'Disgusting',
        'They ask you if you are fine',
        'This is in real time',
        'Visual Basic',
        'Why are you running',
        'The missile knows',
        'Scott Bradford',
        'It turned into apples',
        'I am a wolf',
        'Microsoft Heisenberg',
        'You bet your sweet bippy I did',
        'Is mayo an instrument',
        'JPEG',
        'Bwah',
    ],

    'Quotes': [
        'We Saved The City',
        'trumpgender',
        'George Bush doesnt care about black people',
        'Gay frogs',
        'Sick of this crap',
        'Im a human and im comin',
        'Im a pioneer',
        'My heart is big',
        'Wet ass p word',
        'Whores in this house',
        'Spit in my mouth',
        'We got him',
        'You have a lovely kidney',
        'I am the chosen one',
        'You are fake news',
        'Its very sad',
        'Big massive dumps',
        'We Love You',
        'I am here squandering my life away',
        'Suboptimal',
        'Vindows R',
        'Id fight a homeless guy',
        'Yeah',
        'Youre gaslighting me',
        'Elements of bathrooms',
    ],

    'Clips': [
        'FBI open up',
        'Witness the power',
        'It was dead quiet',
        'Pause the movie',
        'Peep the horror',
        'Sand',
        'Hip young crowd',
        'I am the law',
        'NOOOOOOO',
        'My penis wenis',
        'Congrats on the penis',
        'Onii-chan',
        'Oops',
        'Hey nonbinary hoes',
        'ruhroh',
        'WEEWOO',
        'wee woo'
    ],

    'Friends': [
        'Dont forget to bring a towel',
        'Eww',
        'Exactly how I would have',
        'Fuck the straights',
        'Fucking gross',
        'He just wrote an HTML program',
        'Hydrate yourself',
        'I think it was Yevano',
        'Im gonna take a bong hit',
        'It was you bitch',
        'Kayla Bigger person',
        'Kayla That feels like a self report',
        'Kayla Yeah',
        'Michael Are you a scorpio',
        'Michael Ass',
        'Michael Cya later',
        'Michael Life is like a hurricane',
        'Michael Nice',
        'Michael Wtf',
        'Michael gay bar',
        'Michael youll have to tell me',
        'No',
        'Nononononono',
        'Oh baby',
        'Only galaxy brain people',
        'V Alright',
        'V God dammit',
        'V Guys Im drunk',
        'V Idk what that means',
        'V We love you',
        'Wdym ur not awesome',
        'Yeah he can go die',
        'Your space your area',
        'Youre dead',
    ]
}

const controlContainerRef = dom.ref<HTMLDivElement>('control-container')
const volumeSliderRef = dom.ref<HTMLInputElement>('volume-slider')
const pitchSliderRef = dom.ref<HTMLInputElement>('pitch-slider')
const drySliderRef = dom.ref<HTMLInputElement>('reverb-dry-slider')
const wetSliderRef = dom.ref<HTMLInputElement>('reverb-wet-slider')
const delaySliderRef = dom.ref<HTMLInputElement>('reverb-delay-slider')
const playAllRef = dom.ref<HTMLButtonElement>('play-button')
const stopAllRef = dom.ref<HTMLButtonElement>('stop-button')
const playFriendsRef = dom.ref<HTMLButtonElement>('friends-button')
const loopModeRef = dom.ref<HTMLButtonElement>('loop-button')

const audioControls: AudioControl[] = []
let loopMode = false

function getButtonPlayTimeBackground(playTimeAmount: number) {
    return `linear-gradient(to right, #4d8050 ${playTimeAmount * 100}%, #6cb370 ${playTimeAmount * 100}%)`
}

function animate() {
    for (const control of audioControls) {
        if (control.currentlyPlaying) {
            control.buttonElement.style.background = getButtonPlayTimeBackground(control.getElapsedTime())
        } else {
            control.buttonElement.style.background = ''
        }
    }

    requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

function getSliderValue(slider: HTMLInputElement) {
    return Number.parseInt(slider.value)
}

async function updateVolume() {
    const audioSlider = await volumeSliderRef.get()
    const value = getSliderValue(audioSlider) / 100
    for (const { audioGain } of audioControls) {
        audioGain.gain.setValueAtTime(value, 0)
    }
}

async function updatePitch() {
    const pitchSlider = await pitchSliderRef.get()
    let value = getSliderValue(pitchSlider) / 100
    if (value < 0.5) {
        value += 0.5
    } else {
        value = (value - 0.5) / 1.5 + 1
    }
    for (const control of audioControls) {
        control.pitchMultiplier = value
    }
}

async function updateReverb() {
    let drySlider = await drySliderRef.get()
    let wetSlider = await wetSliderRef.get()
    let delaySlider = await delaySliderRef.get()

    const dry = getSliderValue(drySlider) / 100
    const wet = getSliderValue(wetSlider) / 100
    const delay = getSliderValue(delaySlider) / 100

    for (const control of audioControls) {
        control.reverbNodes.dryGain.gain.value = dry
        control.reverbNodes.wetGain.gain.value = wet
        control.reverbNodes.delayNode.delayTime.value = delay
    }
}

async function updateModifiers() {
    await updateVolume()
    await updatePitch()
    await updateReverb()
}

class AudioControl {
    readonly buttonElement: HTMLButtonElement
    readonly audioContext: AudioContext
    readonly audioBuffer: AudioBuffer
    readonly audioGain: GainNode
    readonly category: string
    readonly reverbNodes: audio.ReverbNodes
    currentlyPlaying: boolean = false
    startTime: number
    pitchMultiplier = 1
    private requestPlayAfterStop: boolean = false

    private audioSource: AudioBufferSourceNode | undefined

    constructor(
        buttonElement: HTMLButtonElement,
        audioContext: AudioContext,
        audioBuffer: AudioBuffer,
        audioGain: GainNode,
        reverbNodes: audio.ReverbNodes,
        category: string
    ) {
        this.buttonElement = buttonElement
        this.audioContext = audioContext
        this.audioBuffer = audioBuffer
        this.audioGain = audioGain
        this.startTime = audioContext.currentTime
        this.reverbNodes = reverbNodes
        this.category = category
    }

    play() {
        if (this.currentlyPlaying) {
            this.stop()
            this.requestPlayAfterStop = true
            return
        }

        this.startTime = this.audioContext.currentTime
        const newAudioSource = this.audioContext.createBufferSource()
        this.audioSource = newAudioSource
        this.audioSource.loop = loopMode
        this.audioSource.detune.setValueAtTime(Math.log2(this.pitchMultiplier) * 1200, 0)
        this.audioSource.buffer = this.audioBuffer
        this.audioSource.connect(this.audioGain)
        this.audioSource.start(0)
        this.currentlyPlaying = true

        this.audioSource?.addEventListener('ended', event => {
            this.currentlyPlaying = false
            if (this.requestPlayAfterStop) {
                this.play()
                this.requestPlayAfterStop = false
            } 
        })
    }

    stop() {
        this.audioSource?.stop()
        this.audioSource = undefined
        this.currentlyPlaying = false
    }

    getDuration() {
        return this.audioBuffer.duration * this.pitchMultiplier
    }

    getElapsedTime() {
        if (!this.currentlyPlaying || this.audioSource === undefined) {
            return 0
        }
        let currentTime = this.audioContext.currentTime - this.startTime
        const duration = this.getDuration()

        if (this.audioSource.loop) {
            currentTime %= duration
        }

        return currentTime / duration
    }
}

async function createAudioButton(name: string, category: string, index: number) {
    const audioContext = new AudioContext()
    const audioBuffer = await audio.load(`../audio/${name}.mp3`, audioContext)
    const audioGain = audioContext.createGain()

    const reverbNodes = audio.connectReverb(audioContext, audioGain, audioContext.destination)

    const buttonElement = document.createElement('button')
    buttonElement.className = 'audio-button'
    buttonElement.setAttribute('pressed', '')
    buttonElement.style.order = index.toString()
    const buttonTitleElement = document.createElement('p')
    buttonTitleElement.textContent = name
    buttonElement.appendChild(buttonTitleElement)

    const audioControl = new AudioControl(buttonElement, audioContext, audioBuffer, audioGain, reverbNodes, category)

    buttonElement.onclick = async event => {
        updateModifiers()
        audioControl.play()
    }

    buttonElement.oncontextmenu = async event => {
        audioControl.stop()
    }

    return audioControl
}

async function addSound(controlContainer: HTMLElement, name: string, category: string, index: number) {
    let audioControl = await createAudioButton(name, category, index)
    controlContainer.appendChild(audioControl.buttonElement)
    audioControls.push(audioControl)
}

function setSliderReset(slider: HTMLInputElement, value: string) {
    slider.oncontextmenu = async event => {
        slider.value = value
        await updateModifiers()
    }
}

function setSliderUpdate(slider: HTMLInputElement) {
    slider.onchange = event => { updateModifiers() }
}

async function initAudioSlider() {
    let volumeSlider = await volumeSliderRef.get()
    let pitchSlider = await pitchSliderRef.get()
    let drySlider = await drySliderRef.get()
    let wetSlider = await wetSliderRef.get()
    let delaySlider = await delaySliderRef.get()
    
    await updateModifiers()
    setSliderUpdate(volumeSlider)
    setSliderUpdate(pitchSlider)
    setSliderUpdate(drySlider)
    setSliderUpdate(wetSlider)
    setSliderUpdate(delaySlider)

    setSliderReset(volumeSlider, '25')
    setSliderReset(pitchSlider, '50')
    setSliderReset(drySlider, '100')
    setSliderReset(wetSlider, '0')
    setSliderReset(delaySlider, '25')
}

async function playAll() {
    updateModifiers()
    for (const control of audioControls) {
        control.play()
    }
}

async function stopAll() {
    for (const control of audioControls) {
        control.stop()
    }
}

function playFriends() {
    for (const control of audioControls) {
        if (control.category === 'Friends') {
            control.play()
        }
    }
}

function* audioFilesIter() {
    for (const category in audioFiles) {
        for (const fileName of audioFiles[category]) {
            yield { category, fileName }
        }
    }
}

function* categoriesIter() {
    for (const category in audioFiles) {
        yield category
    }
}

async function start() {
    document.oncontextmenu = event => {
        event.preventDefault()
    }

    const categories = Array.from(categoriesIter())
    const audioEntries = Array.from(audioFilesIter())

    const controlContainer = await controlContainerRef.get()
    controlContainer.style.gridTemplateColumns = `repeat(${categories.length}, ${100 / categories.length}%)`

    for (const category in audioFiles) {
        const container = document.createElement('div')
        container.className = 'category-column'
        const columnTitleElement = document.createElement('p')
        columnTitleElement.textContent = category
        columnTitleElement.className = 'column-title'
        container.appendChild(columnTitleElement)

        controlContainer.appendChild(container)

        let i = 0

        for (const name of audioFiles[category]) {
            addSound(container, name, category, i)
            i++;
        }
    }

    await initAudioSlider()

    const playAllButton = await playAllRef.get()
    playAllButton.onclick = () => {
        playAll()
    }

    const stopAllButton = await stopAllRef.get()
    stopAllButton.onclick = () => {
        stopAll()
    }

    const friendsButton = await playFriendsRef.get()
    friendsButton.onclick = () => {
        playFriends()
    }

    const loopModeButton = await loopModeRef.get()
    loopModeButton.onclick = () => {
        loopMode = !loopMode
        if (loopMode) {
            loopModeButton.setAttribute('active', 'active')
        } else {
            loopModeButton.removeAttribute('active')
        }
    }
}

start()
