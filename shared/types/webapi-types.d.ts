export declare interface FileMeta {
    name: string
    fileName: string
}

export declare interface StoreMeta {
    fileMetas: FileMeta[]
}

export declare type PutFileResponse
= { error: string, fileName: undefined }
| { error: undefined, fileName: string }

export declare type ListAudioResponse
= { error: string, fileMetas: undefined }
| { error: undefined, fileMeta: FileMeta[] }