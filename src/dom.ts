import { Dictionary, kvs } from "./util"

let loaded = false

window.addEventListener('DOMContentLoaded', () => {
    loaded = true
})

export function getElement<T extends HTMLElement>(id: string): Promise<T> {
    return new Promise((resolve, reject) => {
        if (loaded) {
            const e = document.getElementById(id)
            if (e === null) {
                reject(`element ${id} does not exist`)
                return
            }
            resolve(e as T)
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                const e = document.getElementById(id)
                if (e === null) {
                    reject(`element ${id} does not exist`)
                    return
                }
                resolve(e as T)
            })
        }
    })
}

export interface HTMLElementRef<T extends HTMLElement> {
    get(): Promise<T>
}

export class HTMLElementByIdRef<T extends HTMLElement> implements HTMLElementRef<T> {
    readonly id: string
    element: T | undefined

    constructor(id: string) {
        this.id = id
    }

    async get(): Promise<T> {
        if (this.element === undefined) {
            return await getElement(this.id)
        } else {
            return this.element
        }
    }
}

export function ref<T extends HTMLElement>(id: string) {
    return new HTMLElementByIdRef<T>(id)
}

export function create<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    attrs: Dictionary<{ toString: () => string }>,
    callback: (element: HTMLElementTagNameMap[K]) => void,
    ...children: HTMLElement[]
) {
    const element = document.createElement(tagName)
    for (const [key, value] of kvs(attrs)) {
        element.setAttribute('key', value.toString())
    }
    for (const child of children) {
        element.appendChild(child)
    }
    callback(element)
    return element
}

export function text<K extends keyof HTMLElementTagNameMap>(
    tagName: K, text: string
): HTMLElementTagNameMap[K] {
    const result = document.createElement(tagName)
    result.textContent = text
    return result
}
