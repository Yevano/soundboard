export type RecordingEntry = { displayName: string, fileName: string | null }

export function getRecordingEntries(): RecordingEntry[] {
    const item = localStorage.getItem('recordingEntries')
    if (item !== null) {
        return JSON.parse(item)
    } else {
        return []
    }
}

export function setRecordingEntries(entries: RecordingEntry[]) {
    localStorage.setItem('recordingEntries', JSON.stringify(entries))
}
