export type RecordingEntry = { displayName: string, fileName: string | null }

export function getRecordingEntries(): RecordingEntry[] {
    const item = localStorage.getItem('recordingEntries')
    if (item !== null) {
        return JSON.parse(item)
    } else {
        const entries: RecordingEntry[] = new Array(10)
        for (let i = 0; i < entries.length; i++) {
            entries[i] = {
                displayName: '',
                fileName: null,
            }
        }
        return entries
    }
}

export function setRecordingEntries(entries: RecordingEntry[]) {
    localStorage.setItem('recordingEntries', JSON.stringify(entries))
}
