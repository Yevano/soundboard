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
    'Nonononono',
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

let audioSliderElement: HTMLInputElement

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
    buttonElement.onclick = event => {
        const isShift = event.shiftKey
        if (isShift) {
            audioElement.currentTime = 0
            audioElement.pause()
        } else {
            audioElement.currentTime = 0
            if (!currentlyPlaying) {
                audioElement.volume = Number.parseInt(audioSliderElement.value) / 100
                audioElement.play()
            }
        }
    }

    return buttonElement
}

function addSound(controlContainer: HTMLElement, name: string) {
    /** @type HTMLAudioElement */
    let audioElement = document.createElement('audio')
    // audioElement.setAttribute('controls', true)
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

function updateVolume() {
    for (const { audioElement } of audioControls) {
        audioElement.volume = Number.parseInt(audioSliderElement.value) / 100
    }
}

function initAudioSlider() {
    audioSliderElement = document.getElementById('volume-slider') as HTMLInputElement

    updateVolume()
    audioSliderElement.onchange = event => {
        updateVolume()
    }
}

function onContentLoaded(event: any) {
    let controlContainer = document.getElementById('control-container') as HTMLElement

    for (const name of audioFiles) {
        addSound(controlContainer, name)
    }

    initAudioSlider()
}

window.addEventListener('DOMContentLoaded', onContentLoaded);