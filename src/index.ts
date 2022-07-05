import { audio } from "./audio"
import { dom } from "./dom"
import { Recorder } from "./recording-bank"
import { Dictionary, flatten, sleep } from "./util"

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
        'Id fight a homeless guy',
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
        'wee woo',
        'Future',
        'SUPNERDS',
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
        'Vindows R',
        'Yeah',
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
const recordingBankContainerRef = dom.ref<HTMLDivElement>('recording-bank')

const globalAudioContext = new AudioContext()

const audioEffects = new audio.AudioEffects(globalAudioContext)
audioEffects.postGain.connect(globalAudioContext.destination)

const recorders: Recorder[] = []
const audioControls: audio.AudioControl[] = []

function getAudioPlayers() {
    return flatten<audio.AudioPlayer>([recorders, audioControls])
}

let loopMode = false

function getButtonPlayTimeBackground(playTimeAmount: number) {
    return `linear-gradient(to right, #4d8050 ${playTimeAmount * 100}%, #6cb370 ${playTimeAmount * 100}%)`
}

function getRecordingButtonPlayTimeBackground(playTimeAmount: number) {
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

    for (const recorder of recorders) {
        if (recorder.currentlyPlaying) {
            recorder.buttonElement.style.background = getRecordingButtonPlayTimeBackground(recorder.getElapsedTime())
        } else {
            recorder.buttonElement.style.background = ''
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
    audioEffects.setGain(value)
}

async function updatePitch() {
    const pitchSlider = await pitchSliderRef.get()
    let value = getSliderValue(pitchSlider) / 100
    if (value < 0.5) {
        value += 0.5
    } else {
        value = (value - 0.5) / 1.5 + 1
    }
    for (const player of getAudioPlayers()) {
        player.detune(value)
    }
}

async function updateReverb() {
    let drySlider = await drySliderRef.get()
    let wetSlider = await wetSliderRef.get()
    let delaySlider = await delaySliderRef.get()

    const dry = getSliderValue(drySlider) / 100
    const wet = getSliderValue(wetSlider) / 100
    const delay = getSliderValue(delaySlider) / 100

    audioEffects.setReverb(dry, wet, delay)
}

async function updateModifiers() {
    await updateVolume()
    await updatePitch()
    await updateReverb()
}

async function createAudioButton(name: string, category: string, index: number) {
    const audioBuffer = await audio.load(`../audio/${name}.mp3`, globalAudioContext)

    const buttonElement = document.createElement('button')
    buttonElement.className = 'audio-button'
    buttonElement.setAttribute('pressed', '')
    buttonElement.style.order = index.toString()
    const buttonTitleElement = document.createElement('p')
    buttonTitleElement.textContent = name
    buttonElement.appendChild(buttonTitleElement)

    const audioControl = new audio.AudioControl(buttonElement, globalAudioContext, audioBuffer, audioEffects.preGain, category)

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
    slider.oninput = event => { updateModifiers() }
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

    const recordingBankContainer = await recordingBankContainerRef.get()
    
    for (let i = 0; i < 4; i++) {
        const buttonElement = document.createElement('button')
        const recorder = new Recorder(buttonElement, i, globalAudioContext, audioEffects.getEffectOutputNode(), audioEffects.preGain)
        recorders.push(recorder)
        buttonElement.appendChild(dom.text('p', `Recording #${i + 1}`))
        buttonElement.onclick = event => {
            if (recorder.currentlyRecording) {
                buttonElement.removeAttribute('recording')
                recorder.stopRecording()
                return
            }

            if (event.shiftKey) {
                buttonElement.setAttribute('recording', 'recording')
                recorder.record()
            } else {
                updateModifiers()
                recorder.play()
            }
        }

        buttonElement.oncontextmenu = event => {
            recorder.stop()
        }

        recordingBankContainer.appendChild(buttonElement)

    }
}

start()
