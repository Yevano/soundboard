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
    ],

    'Memes': [
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
const audioSliderRef = dom.ref<HTMLInputElement>('volume-slider')
const playAllRef = dom.ref<HTMLButtonElement>('play-button')
const stopAllRef = dom.ref<HTMLButtonElement>('stop-button')
const playFriendsRef = dom.ref<HTMLButtonElement>('friends-button')

let audioControls: AudioControl[] = []

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

async function updateVolume() {
    for (const { audioGain } of audioControls) {
        const audioSlider = await audioSliderRef.get()
        audioGain.gain.setValueAtTime(Number.parseInt(audioSlider.value) / 100, 0)
    }
}

class AudioControl {
    readonly buttonElement: HTMLButtonElement
    readonly audioContext: AudioContext
    readonly audioBuffer: AudioBuffer
    readonly audioGain: GainNode
    currentlyPlaying: boolean = false
    startTime: number
    private requestPlayAfterStop: boolean = false

    private audioSource: AudioBufferSourceNode | undefined

    constructor(
        buttonElement: HTMLButtonElement,
        audioContext: AudioContext,
        audioBuffer: AudioBuffer,
        audioGain: GainNode
    ) {
        this.buttonElement = buttonElement
        this.audioContext = audioContext
        this.audioBuffer = audioBuffer
        this.audioGain = audioGain
        this.startTime = audioContext.currentTime
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

    getElapsedTime() {
        if (!this.currentlyPlaying) {
            return 0
        }
        const currentTime = this.audioContext.currentTime - this.startTime
        return currentTime / this.audioBuffer.duration
    }
}

async function createAudioButton(name: string, index: number) {
    const audioContext = new AudioContext()
    const audioBuffer = await audio.load(`../audio/${name}.mp3`, audioContext)
    const audioGain = audioContext.createGain()
    audioGain.connect(audioContext.destination)

    const buttonElement = document.createElement('button')
    buttonElement.className = 'audio-button'
    buttonElement.setAttribute('pressed', '')
    buttonElement.style.order = index.toString()
    const buttonTitleElement = document.createElement('p')
    buttonTitleElement.textContent = name
    buttonElement.appendChild(buttonTitleElement)

    const audioControl = new AudioControl(buttonElement, audioContext, audioBuffer, audioGain)

    buttonElement.onclick = async event => {
        updateVolume()
        audioControl.play()
    }

    buttonElement.oncontextmenu = async event => {
        audioControl.stop()
    }

    return audioControl
}

async function addSound(controlContainer: HTMLElement, name: string, index: number) {
    let audioControl = await createAudioButton(name, index)
    controlContainer.appendChild(audioControl.buttonElement)
    audioControls.push(audioControl)
}

async function initAudioSlider() {
    let audioSliderElement = await audioSliderRef.get()
    audioSliderElement = document.getElementById('volume-slider') as HTMLInputElement

    await updateVolume()
    audioSliderElement.onchange = async event => {
        await updateVolume()
    }
}

async function playAll() {
    updateVolume()
    for (const control of audioControls) {
        control.play()
    }
}

async function stopAll() {
    for (const control of audioControls) {
        control.stop()
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
            addSound(container, name, i)
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

    }

}

start()