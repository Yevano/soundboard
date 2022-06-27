let loaded = false

window.addEventListener('DOMContentLoaded', () => {
    loaded = true
})

export namespace dom {
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

    export class HTMLElementRef<T extends HTMLElement> {
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
        return new HTMLElementRef<T>(id)
    }
}
