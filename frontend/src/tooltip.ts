export class Tooltip {
    readonly parent: HTMLElement

    constructor(parent: HTMLElement) {
        this.parent = parent
    }

    show() {
        this.parent.classList.add('tooltip')
    }
}

/* export function showTooltip(element: HTMLElement, text: string) {
    const tooltip = new Tooltip(element, text)
    tooltip.show()
    return tooltip
} */