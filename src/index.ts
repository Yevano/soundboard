import { dom } from "./dom"
import { sleep } from "./util"

const audioFiles = [
    'Laugh Track',
    'Nice',
    'FBI open up',
    'Windows 95 Error',
    'Disgusting',
    'Michaels birthday',
    'Pause the movie',
    'Witness the power',
    'Peep the horror',
    'It was dead quiet',
    'Gay frogs',
    'Sick of this crap',
    'Im a human and im comin',
    'Im a pioneer',
    'My heart is big',
    'They ask you if you are fine',
    'Wet ass p word',
    'Whores in this house',
    'Spit in my mouth',
    'This is in real time',
    'Visual Basic',
    'Police Siren 1',
    'Police Siren 2',
    'Why are you running',
    'The missile knows',
    'Sand',
    'Hip young crowd',
    'Bet on it',
    'How could this happen to me',
    'You have a lovely kidney',
    'I am the chosen one',
    'You are fake news',
    'Its very sad',
    'Big massive dumps',
    'We Love You',
    'Noot',
    'Gun shot 1',
    'Machine gun 1',
    'Scott Bradford',
    'I am here squandering my life away',
    'Suboptimal',
    'It turned into apples',
    'Please end my suffering',
    'I am the law',
    'I am a wolf',
    'Microsoft Heisenberg',
    'George Bush doesnt care about black people',
    'E',
    'Lets do the fork in the garbage disposal',
    'STOP',
    'I have so far to go',
    'You bet your sweet bippy I did',
    'Vindows R',
    'Id fight a homeless guy',
    'Yeah',
    'Youre gaslighting me',
    'NOOOOOOO',
    'Is mayo an instrument',
    'My penis wenis',
    'Congrats on the penis',
    'Onii-chan',
    'Oops',
    'JPEG',
    'Bwah',
    'We got him',
    'Elements of bathrooms',
    'Hey nonbinary hoes',
    'Clubbed to death',
    'Monster Mashturbate',
    'GBA',
]

const controlContainerRef = dom.ref<HTMLDivElement>('control-container')
const audioSliderRef = dom.ref<HTMLInputElement>('volume-slider')
const playAllRef = dom.ref<HTMLButtonElement>('play-button')
const stopAllRef = dom.ref<HTMLButtonElement>('stop-button')

type AudioControl = { buttonElement: HTMLButtonElement, audioElement: HTMLAudioElement }

let audioControls: AudioControl[] = []

function getButtonPlayTimeBackground(playTimeAmount: number) {
    return `linear-gradient(to right, #4d8050 ${playTimeAmount * 100}%, #6cb370 ${playTimeAmount * 100}%)`
}

function animate() {
    for (const { audioElement, buttonElement } of audioControls) {
        if (!audioElement.paused) {
            const playTime = audioElement.currentTime / audioElement.duration
            buttonElement.style.background = getButtonPlayTimeBackground(playTime)
        } else {
            buttonElement.style.background = ''
        }
    }

    requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

function createAudioButton(name: string, audioElement: HTMLAudioElement) {
    const buttonElement = document.createElement('button')
    buttonElement.className = 'audio-button'
    //buttonElement.setAttribute('pressed', '')
    let currentlyPlaying = false
    buttonElement.innerHTML = name
    buttonElement.onclick = async event => {
        const isShift = event.shiftKey
        if (isShift) {
            audioElement.currentTime = 0
            audioElement.pause()
        } else {
            audioElement.currentTime = 0
            if (!currentlyPlaying) {
                const audioSlider = await audioSliderRef.get()
                audioElement.volume = Number.parseInt(audioSlider.value) / 100
                audioElement.play()
            }
        }
    }

    return buttonElement
}

function addSound(controlContainer: HTMLElement, name: string) {
    let audioElement = document.createElement('audio')
    audioElement.setAttribute('src', `../audio/${name}.mp3`)
    controlContainer.appendChild(audioElement)
    
    let buttonElement = createAudioButton(name, audioElement)
    controlContainer.appendChild(buttonElement)

    audioControls.push({
        audioElement, buttonElement
    })

    audioElement.onplay = event => {
        buttonElement.setAttribute('playing', '')
    }

    audioElement.onpause = event => {
        buttonElement.removeAttribute('playing')
    }
}

async function updateVolume() {
    for (const { audioElement } of audioControls) {
        const audioSlider = await audioSliderRef.get()
        audioElement.volume = Number.parseInt(audioSlider.value) / 100
    }
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
    for (const control of audioControls) {
        await sleep(50)
        control.audioElement.currentTime = 0
        control.audioElement.play()
    }
}

async function stopAll() {
    for (const control of audioControls) {
        control.audioElement.pause()
        control.audioElement.currentTime = 0
    }
}

async function start() {
    for (const name of audioFiles) {
        addSound(await controlContainerRef.get(), name)
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
}

start()