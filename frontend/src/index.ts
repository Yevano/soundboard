import { audio } from "./audio"
import { create, ref, showTooltip, text, Tooltip } from "./dom"
import { isKeyDown } from "./keyboard"
import { Recorder } from "./recording-bank"
import { clamp, Color, colorFromAngle, Dictionary, doAsync, filter, flatten, max, next, sleep } from "./util"
import { getAudioBuffer, getAudioList, putAudioFile } from "./webapi"
import { CustomWindow, globalThis } from './global'
import { Modal } from "./modal"
// import signalMultiplierWorkletURL from 'worklet-loader!./audio-worklets/signal-multiplier-processor.worklet.ts'
import { WorkerUrl } from 'worker-url'

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
        'bark4me',
        'Dominating',
        'Double kill',
        'First blood',
        'Godlike',
        'Headshot',
        'Holy shit',
        'Humiliation',
        'Killing spree',
        'Monster kill',
        'Pancake',
        'Play',
        'Rampage',
        'Teamkiller',
        'Triple kill',
        'Ultrakill',
        'Unstoppable',
        'Vehicular manslaughter',
        'You have lost the match',
        'You have won the match',
        'Quack',
        'Hawnk',
        'Oof',
        'TS Banned',
        'TS Beep beep',
        'TS Connection lost',
        'TS Error',
        'TS Hey wake up',
        'TS Insufficient',
        'TS See you soon',
        'TS Sound muted',
        'TS Sound resumed',
        'TS User entered',
        'TS User joined',
        'TS User left',
        'TS Welcome back',
        'TS Welcome to TeamSpeak',
        'TS You were kicked from the channel',
        'TS You were kicked from the server',
        'TS You were moved',
        'TS You were banned',
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
        'Crazy Bark',
        'Cool alright',
        'If I mess up my dads gonna beat me',
        'You sit on your ass',
        'Not alright',
        'You blocked me on facebook',
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
        'Im gay',
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
        'My tweet violated the twitter rules',
        'Twitter is a rathole',
        'Up yours woke moralists',
        'What rules',
        'Who cancels who',
        'Very Stable',
        'YoureABunchaPussies',
        'Cut them off',
        'Breasts',
        'There are feminine boys',
        'Murder is legal',
        'Stop it get some help',
        'STOP THE HAMMERING',
        'You have been stopped',
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
        'Thats how it flows',
        'Dinosaurs are ours',
        'My favorite big booty Latina',
        'GAS',
        'America deserved 911',
        'Get wrist control',
        'Pull out your gun',
        'He wants your money to buy crack',
        'Thats when I pull out my gun',
        'Ring ring the schoolbell',
        'My names Brian I like to skateboard',
        'What an idiot',
        'Murder time fun time',
        'jermaThing',
        'Am I alive',
        'Whats going on',
        'Monopoly over the phone',
        'Whats that on TV',
        'I buy porn everytime I go to the hotel',
        'Bitches',
        'Bye bye',
        'You are matched',
        'Crap',
        'transgender',
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
        'Ill be here all week',
        'Who do you think me for',
        'Yes',
        'Im calling the cop'
    ]
}

const controlContainerRef = ref<HTMLDivElement>('control-container')
const volumeSliderRef = ref<HTMLInputElement>('volume-slider')
const pitchSliderRef = ref<HTMLInputElement>('pitch-slider')
const drySliderRef = ref<HTMLInputElement>('reverb-dry-slider')
const wetSliderRef = ref<HTMLInputElement>('reverb-wet-slider')
const delaySliderRef = ref<HTMLInputElement>('reverb-delay-slider')
const playAllRef = ref<HTMLButtonElement>('play-button')
const stopAllRef = ref<HTMLButtonElement>('stop-button')
const playFriendsRef = ref<HTMLButtonElement>('friends-button')
const loopModeRef = ref<HTMLButtonElement>('loop-button')
const recordingBankContainerRef = ref<HTMLDivElement>('recording-bank')

const globalAudioContext = new AudioContext()

let audioEffects!: audio.AudioEffects

const recorders: Recorder[] = []
const audioControls: audio.AudioControl[] = []

class Slider {
    readonly inputElement: HTMLInputElement
    inputValue = 0
    inputHandler: (value: number) => void = (_: number) => { }

    constructor(inputElement: HTMLInputElement, defaultValue: number) {
        this.inputElement = inputElement
        this.value = defaultValue

        inputElement.oninput = _ => {
            this.inputValue = this.getElementValue()
            this.inputHandler(this.inputValue)
        }

        inputElement.oncontextmenu = _ => {
            this.value = defaultValue
        }
    }

    get value() {
        return this.inputValue
    }

    set value(value: number) {
        value = clamp(value, 0, 1)
        this.inputValue = value
        const minValue = Number.parseInt(this.inputElement.min)
        const maxValue = Number.parseInt(this.inputElement.max)
        const newValue = (maxValue - minValue) * value + minValue
        this.inputElement.value = newValue.toString()
        this.inputHandler(this.inputValue)
    }

    private getElementValue() {
        const minValue = Number.parseInt(this.inputElement.min)
        const maxValue = Number.parseInt(this.inputElement.max)
        const inputValue = Number.parseInt(this.inputElement.value)
        return (inputValue - minValue) / (maxValue - minValue)
    }
}

interface ModifierSliders {
    volumeSlider: Slider,
    pitchSlider: Slider,
    drySlider: Slider,
    wetSlider: Slider,
    delaySlider: Slider,
}

const sliderPromise: Promise<ModifierSliders> = (async () => {
    const [
        volumeSliderElement,
        pitchSliderElement,
        drySliderElement,
        wetSliderElement,
        delaySliderElement,
    ] = await Promise.all([
        volumeSliderRef.get(),
        pitchSliderRef.get(),
        drySliderRef.get(),
        wetSliderRef.get(),
        delaySliderRef.get(),
    ])

    return {
        volumeSlider: new Slider(volumeSliderElement, 0.05),
        pitchSlider: new Slider(pitchSliderElement, 0.5),
        drySlider: new Slider(drySliderElement, 1),
        wetSlider: new Slider(wetSliderElement, 0),
        delaySlider: new Slider(delaySliderElement, 0.25),
    }
})()

function getAudioPlayers() {
    return flatten<audio.AudioPlayer>([recorders, audioControls])
}

let loopMode = false

function getButtonPlayTimeBackground(playTimeAmount: number) {
    return `linear-gradient(to right, #8c7099aa ${playTimeAmount * 100}%, #8c709945 ${playTimeAmount * 100}%)`
}

function getRecordingButtonPlayTimeBackground(playTimeAmount: number) {
    return `linear-gradient(to right, #ff5656d0 ${playTimeAmount * 100}%, #ff565694 ${playTimeAmount * 100}%)`
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

function controlFromClipAndName(category: string, name: string): audio.AudioPlayer | undefined {
    return next(filter(audioControls, c => c.category === category && c.name === name))
}

function controlFromName(name: string): audio.AudioPlayer | undefined {
    return next(filter(audioControls, c => c.name === name))
}

function updateVolume(volumeSlider: Slider) {
    audioEffects.setGain(volumeSlider.value)
}

async function updatePitch(pitchSlider: Slider) {
    let value = pitchSlider.value
    if (value < 0.5) {
        value += 0.5
    } else {
        value = (value - 0.5) / 1.5 + 1
    }
    for (const player of getAudioPlayers()) {
        player.detune(value)
    }
}

async function updateReverb(drySlider: Slider, wetSlider: Slider, delaySlider: Slider) {
    const dry = drySlider.value
    const wet = wetSlider.value
    const delay = delaySlider.value

    audioEffects.setReverb(dry, wet, delay)
}

const emptyBuffer = globalAudioContext.createBuffer(2, 1, 44100)

async function createAudioButton(name: string, category: string, index: number) {
    const buttonElement = document.createElement('button')
    buttonElement.className = 'audio-button'
    buttonElement.setAttribute('pressed', '')
    buttonElement.style.order = index.toString()
    const buttonTitleElement = document.createElement('p')
    buttonTitleElement.textContent = name
    buttonElement.appendChild(buttonTitleElement)

    const audioControl = new audio.AudioControl(
        buttonElement, globalAudioContext, emptyBuffer, audioEffects.inputNode, category, name
    )

    doAsync(async () => {
        const audioBuffer = await getAudioBuffer(`${name}.mp3`, globalAudioContext)

        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            const buffer = audioBuffer.getChannelData(i)
            const sampleDuration = 0.1
            const targetVolume = 0
            audio.normalize(buffer, targetVolume, audioBuffer.sampleRate * sampleDuration)
        }

        audioControl.setAudioBuffer(audioBuffer)
    })

    buttonElement.onclick = async event => {
        audioControl.play()
    }

    buttonElement.oncontextmenu = async event => {
        audioControl.stop()
    }

    const tooltip = new Tooltip(buttonElement)
    tooltip.messageElement.style.fontSize = '2em'
    tooltip.messageElement.style.userSelect = 'none'

    buttonElement.onmouseenter = event => {
        tooltip.show(name)
        // buttonTitleElement.style.overflow = 'visible'
    }

    buttonElement.onmouseleave = event => {
        tooltip.hide()
        // buttonTitleElement.style.overflow = 'hidden'
    }

    return audioControl
}

async function addSound(controlContainer: HTMLElement, name: string, category: string, index: number, color: Color) {
    let audioControl = await createAudioButton(name, category, index)
    controlContainer.appendChild(audioControl.buttonElement)
    audioControls.push(audioControl)
}

async function initAudioSlider() {
    const sliders = await sliderPromise
    return sliders
}

async function playAll() {
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

type BindValue
= audio.AudioPlayer
| ((e: KeyboardEvent) => void)
| audio.AudioPlayer[]

async function start() {
    document.oncontextmenu = event => {
        event.preventDefault()
    }

    const signalMultiplierWorkletURL = new WorkerUrl(
        new URL('./audio-worklets/signal-multiplier-processor.ts', import.meta.url), {
            name: 'signal-multiplier-processor'
        }
    )

    const biasWorkletURL = new WorkerUrl(
        new URL('./audio-worklets/multiply-processor.ts', import.meta.url), {
            name: 'multiply-processor'
        }
    )

    await globalAudioContext.audioWorklet.addModule(signalMultiplierWorkletURL)
    await globalAudioContext.audioWorklet.addModule(biasWorkletURL)

    audioEffects = new audio.AudioEffects(globalAudioContext)
    audioEffects.postGainNode.connect(globalAudioContext.destination)

    const categories = Array.from(categoriesIter())
    const audioEntries = Array.from(audioFilesIter())

    const controlContainer = await controlContainerRef.get()
    controlContainer.style.gridTemplateColumns = `repeat(${categories.length}, ${100 / categories.length}%)`

    let hue = 0
    let numCategories = categories.length

    const soundPromise = (async () => {
        const soundPromises: Promise<void>[] = []

        for (const category in audioFiles) {
            const container = document.createElement('div')
            container.className = 'category-column'
            controlContainer.appendChild(container)
    
            const buttonGridContainer = document.createElement('div')
            buttonGridContainer.className = 'category-column-button-grid'
            const columnTitleElement = document.createElement('p')
            columnTitleElement.textContent = category
            columnTitleElement.className = 'column-title'
            buttonGridContainer.appendChild(columnTitleElement)
    
            container.appendChild(buttonGridContainer)
    
            let i = 0
    
            for (const name of audioFiles[category]) {
                soundPromises.push(addSound(buttonGridContainer, name, category, i, colorFromAngle(hue)))
                i++;
            }
    
            hue += 2 * Math.PI / numCategories
        }

        await Promise.all(soundPromises)
    })()

    const sliders = await initAudioSlider()

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

        for (const player of getAudioPlayers()) {
            player.loopMode = loopMode
        }
    }

    const recordingBankContainer = await recordingBankContainerRef.get()
    
    for (let i = 0; i < 10; i++) {
        const buttonElement = document.createElement('button')
        const recorder = new Recorder(buttonElement, i, globalAudioContext, audioEffects.preGainNode, audioEffects.inputNode)
        recorders.push(recorder)
        buttonElement.appendChild(text('p', `Recording #${i + 1}`))
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
                recorder.play()
            }
        }

        buttonElement.oncontextmenu = event => {
            recorder.stop()
        }

        recordingBankContainer.appendChild(buttonElement)

    }

    sliders.volumeSlider.inputHandler = value => {
        updateVolume(sliders.volumeSlider)
    }

    sliders.pitchSlider.inputHandler = value => {
        updatePitch(sliders.pitchSlider)
    }

    sliders.drySlider.inputHandler = value => {
        updateReverb(sliders.drySlider, sliders.wetSlider, sliders.delaySlider)
    }

    sliders.wetSlider.inputHandler = value => {
        updateReverb(sliders.drySlider, sliders.wetSlider, sliders.delaySlider)
    }

    sliders.delaySlider.inputHandler = value => {
        updateReverb(sliders.drySlider, sliders.wetSlider, sliders.delaySlider)
    }

    sliders.volumeSlider.value = 0.05
    sliders.pitchSlider.value = 0.5
    sliders.drySlider.value = 1
    sliders.wetSlider.value = 0
    sliders.delaySlider.value = 0.25

    let overrideKeyBinds = false

    const keyBinds: Dictionary<BindValue> = {
        'KeyQ': [controlFromName('Laugh Track')!, controlFromName('Windows 95 Error')!],
        'KeyP': controlFromName('Police Siren 1')!,
        'BracketLeft': controlFromName('Police Siren 2')!,
        'BracketRight': controlFromName('Im calling the cop')!,
        'KeyA': controlFromName('Gun shot 1')!,
        'KeyL': controlFromName('Quack')!,
        'KeyH': controlFromName('Headshot')!,
        'KeyN': [controlFromName('Nononononono')!, controlFromName('Not alright')!],
        'KeyT': [controlFromName('bark4me')!, controlFromName('Bitches')!],
        'Semicolon': controlFromName('Hawnk')!,
        'KeyM': [controlFromName('Stop it get some help')!, controlFromName('Murder is legal')!],
        'KeyX': [controlFromName('STOP')!, controlFromName('STOP THE HAMMERING')!],
        'KeyO': controlFromName('OBAMNA')!,
        'KeyB': [controlFromName('Bwah')!, controlFromName('Breasts')!],
        'KeyD': controlFromName('Bye bye')!,
        'KeyU': controlFromName('Im gay')!,
        'KeyV': controlFromName('Its very sad')!,
        'KeyZ': controlFromName('We Love You')!,
        'KeyJ': controlFromName('What rules')!,
        'KeyC': [controlFromName('jermaThing')!, controlFromName('Wet ass p word')!],
        'KeyS': controlFromName('Oof')!,
        'KeyR': [controlFromName('Thats how it flows')!, controlFromName('Ring ring the schoolbell')!],
        'KeyF': controlFromName('Dinosaurs are ours')!,
        'KeyK': controlFromName('My favorite big booty Latina')!,
        'KeyG': controlFromName('GAS')!,
        'KeyW': [controlFromName('Youre dead')!, controlFromName('What an idiot')!],
        'KeyE': controlFromName('Eww')!,
        'KeyI': controlFromName('Yes')!,
        'KeyY': controlFromName('Not alright')!,
        'Insert': controlFromName('Crap')!,

        'Digit1': recorders[0],
        'Digit2': recorders[1],
        'Digit3': recorders[2],
        'Digit4': recorders[3],
        'Digit5': recorders[4],
        'Digit6': recorders[5],
        'Digit7': recorders[6],
        'Digit8': recorders[7],
        'Digit9': recorders[8],
        'Digit0': recorders[9],

        'Minus': _ => { sliders.volumeSlider.value -= 0.1 },
        'Equal': _ => { sliders.volumeSlider.value += 0.1 },
        'Comma': _ => { sliders.pitchSlider.value -= 0.1 },
        'Period': _ => { sliders.pitchSlider.value += 0.1 },

        'Numpad7': _ => { sliders.drySlider.value -= 0.1 },
        'Numpad8': _ => { sliders.drySlider.value += 0.1 },
        'Numpad4': _ => { sliders.wetSlider.value -= 0.1 },
        'Numpad5': _ => { sliders.wetSlider.value += 0.1 },
        'Numpad1': _ => { sliders.delaySlider.value -= 0.1 },
        'Numpad2': _ => { sliders.delaySlider.value += 0.1 },
        
        'End': _ => stopAll()

    }

    const dropzone = document.getElementById('dropzone')!
    
    addEventListener('keydown', event => {
        if (event.code === 'F' && event.ctrlKey) {
            event.preventDefault()
            // openSearch()
            return
        }

        if (overrideKeyBinds) {
            return
        }
        if (event.code === 'Space') {
            event.preventDefault()
        }

        const code = event.code
        if (event.repeat) {
            return
        }
        
        console.log(code)
        if (code in keyBinds) {
            event.preventDefault()
            const control = keyBinds[code]

            if (control instanceof Recorder) {
                if (event.altKey && !control.currentlyRecording) {
                    control.record()
                    return
                } else if (control.currentlyRecording) {
                    control.stopRecording()
                    return
                }
            }

            if (control instanceof Function) {
                control(event)
            } else {
                let selectedControl: audio.AudioPlayer
                if (control instanceof Array) {
                    const i = isKeyDown('Space') ? 1 : 0
                    selectedControl = control[i]
                } else {
                    selectedControl = control
                }

                if (event.shiftKey && selectedControl.currentlyPlaying) {
                    selectedControl.stop()
                } else {
                    selectedControl.play()
                }
            }
        }
    })

    addEventListener('keyup', event => {
        if (overrideKeyBinds) {
            return
        }
        const code = event.code
        if (event.repeat) {
            return
        }
        if (code in keyBinds) {
            const control = keyBinds[code]
            if (event.shiftKey && !(control instanceof Function)) {
                if (control instanceof Array) {
                    control[isKeyDown('Space') ? 1 : 0].stop()
                } else {
                    control.stop()
                }
            }
        }
    })

    console.log(document.body)
  
    let fileDraggedOver = false

    const modal = new Modal<string>(dropzone)

    document.body.ondragover = event => {
        event.stopPropagation()
        event.preventDefault()

        if (fileDraggedOver) {
            return
        }

        fileDraggedOver = true
        dropzone.style.visibility = 'visible'
        dropzone.style.opacity = '0.5'
        console.log('dragged over')
    }

    dropzone.ondragleave = event => {
        console.log('leave')
        event.stopPropagation()
        event.preventDefault()
        fileDraggedOver = false
        dropzone.style.visibility = 'hidden'
        dropzone.style.opacity = '0'
    }

    dropzone.ondrop = async event => {
        event.stopPropagation()
        event.preventDefault()
        dropzone.style.visibility = 'hidden'
        dropzone.style.opacity = '0'
        console.log('drop')
        fileDraggedOver = false

        const doFileItem = async (file: File) => {
            console.log(`File name: ${file.name}`)
            const fileName = await modal.show(element => {
                dropzone.style.visibility = 'visible'
                dropzone.style.opacity = '1'
                overrideKeyBinds = true
                return new Promise<string>(resolve => {
                    element.appendChild(create('div', { },
                        container => {
                            const s = container.style
                            s.display = 'flex'
                            s.flexDirection = 'column'
                            s.alignItems = 'center'
                            s.justifyContent = 'center'
                            s.position = 'relative'
                            s.width = '100vw'
                            s.height = '100vh'
                        },
                        create('p', { }, p => {
                            p.innerText = 'Enter file name'
                            p.style.color = 'white'
                        }),
                        create('input', { type: 'text' }, e => {
                            e.onkeydown = event => {
                                if (event.code !== 'Enter') {
                                    return
                                }
                                console.log(e.value)
                                e.onkeydown = null
                                dropzone.style.visibility = 'hidden'
                                dropzone.style.opacity = '0'
                                resolve(e.value)
                            }
                        })
                    ))
                })
            })

            overrideKeyBinds = false

            await putAudioFile(fileName, file)
        }

        const dataTransfer = event.dataTransfer
        if (!dataTransfer) {
            console.log('no event.dataTransfer')
            return
        }

        for (let i = 0; i < dataTransfer.items.length; i++) {
            const item = dataTransfer.items[i]
            console.log(item)
            if (item.kind !== 'file') {
                continue
            }
            const file = item.getAsFile()
            if (file) {
                await doFileItem(item.getAsFile()!)
            } else {
                console.log('item.getAsFile() returned null')
            }
        }
    }

    try {
        const userMedia = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
        console.log('error getting user device:', e)
    }

    console.log('awaiting sounds to load')

    await soundPromise

    console.log(`${audioControls.length} sounds loaded`)
}

start()
