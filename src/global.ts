export type CustomWindow = {
    onDragOver(event: DragEvent): void
    onDrop(event: DragEvent): void
}

export declare let globalThis: CustomWindow

/* declare const onDragOver: (event: DragEvent) => void
declare const onDrop: (event: DragEvent) => void */