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
        element.setAttribute(key, value.toString())
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

export class Tooltip {
    readonly parent: HTMLElement
    readonly relativeElement: HTMLDivElement
    readonly element: HTMLDivElement
    readonly messageElement: HTMLParagraphElement

    constructor(element: HTMLElement) {
        this.parent = element

        this.relativeElement = create('div', { }, e => {
            e.style.position = 'absolute'
            e.style.display = 'none'
        })

        this.messageElement = text('p', '')
        this.messageElement.style.color = 'black'

        this.element = create('div', { }, e => {
            e.style.position = 'absolute'
            e.style.zIndex = '10'
            e.style.bottom = '4em'
            e.style.backgroundColor = 'rgba(255, 255, 255, 0.75)'
            e.style.borderRadius = '0.5em'
            e.style.padding = '0.5em'
            this.relativeElement.appendChild(e)
        }, this.messageElement)

        this.parent.appendChild(this.relativeElement)
    }

    show(message: string) {
        this.messageElement.textContent = message
        this.relativeElement.style.display = ''
        moveRelativeInsideViewport(this.element)
    }

    hide() {
        this.relativeElement.style.display = 'none'
    }
}

// TODO: This is really wrong but it works right now.
export function moveRelativeInsideViewport(element: HTMLElement, viewport = window.visualViewport!) {
    let rect = element.getBoundingClientRect()
    let parentRect = (element.parentElement || document.body).getBoundingClientRect()
    if (rect.left < viewport.pageLeft) {
        let leftRelativeToParent = rect.left - parentRect.left
        const leftRelativeToPage = rect.left - viewport.pageLeft
        leftRelativeToParent -= leftRelativeToPage
        element.style.left = `${leftRelativeToParent}px`
        rect = element.getBoundingClientRect()
    }

    if (rect.top < viewport.pageTop) {
        let topRelativeToParent = rect.top - parentRect.top
        const topRelativeToPage = rect.top - viewport.pageTop
        topRelativeToParent -= topRelativeToPage
        element.style.top = `${topRelativeToParent}px`
        rect = element.getBoundingClientRect()
    }

    if (rect.right > viewport.width) {
        console.log(rect.right, parentRect.right, viewport.width)
        let rightRelativeToParent = rect.right - parentRect.right
        const rightRelativeToPage = rect.right - viewport.width
        console.log(rightRelativeToParent, rightRelativeToPage)
        rightRelativeToParent -= rightRelativeToPage
        element.style.left = ''
        element.style.right = `-${rightRelativeToParent}px`
        rect = element.getBoundingClientRect()
    }

    if (rect.bottom > viewport.height) {
        let bottomRelativeToParent = rect.bottom - parentRect.bottom
        const bottomRelativeToPage = rect.bottom - viewport.height
        bottomRelativeToParent -= bottomRelativeToPage
        element.style.bottom = `${bottomRelativeToParent}px`
    }
}

export function showTooltip(message: string, element: HTMLElement) {
    // const tooltipDiv = document.createElement('div')
    const tooltipDiv = create('div', { }, e => {
        e.style.position = 'absolute'
        element.appendChild(e)
    }, text('p', message))

    return tooltipDiv
}

// export function get