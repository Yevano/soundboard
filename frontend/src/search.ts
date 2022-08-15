import { create } from "./dom";
import { Modal } from "./modal";

export const searchModal = new Modal<string | undefined>(document.getElementById('dropzone')!)

function hookInput(inputElement: HTMLInputElement, resultsElement: HTMLDivElement, resolve: (result: string) => void) {
    inputElement.onkeydown = event => {
        if (event.code !== 'Enter') {
            
        } else {
            
        }
    }
}

function render(modalElement: HTMLDivElement): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
        const searchResultsElement = create('div', { }, e => {
            e.style.minWidth = '400px'
            e.style.display = 'flex'
            e.style.flexDirection = 'column'
        })

        const inputElement = create('input', { type: 'text' },
            e => hookInput(e, searchResultsElement, resolve)
        )
    })
}

export function doSearch(): Promise<string | undefined> {
    return searchModal.show(render)
}