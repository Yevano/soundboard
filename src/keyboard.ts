const keys: Record<string, true> = { }

addEventListener('keydown', event => {
    keys[event.code] = true
})

addEventListener('keyup', event => {
    delete keys[event.code]
})

export function isKeyDown(keyCode: string) {
    return keyCode in keys
}