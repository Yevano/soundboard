import { create } from "./dom"

export class Modal<Result> {
    readonly element: HTMLDivElement

    constructor(parentElement: HTMLElement) {
        this.element = create('div', { }, e => {
            e.style.visibility = 'hidden'
            e.style.position = 'absolute'
        })
        parentElement.appendChild(this.element)
    }

    async show(renderer: (modalElement: HTMLDivElement) => Promise<Result>) {
        this.element.style.visibility = 'visible'
        const result = await renderer(this.element)
        this.element.style.visibility = 'hidden'
        return result
    }
}
