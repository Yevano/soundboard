export type Dictionary<V> = { [key: string]: V }

export function sleep(timeMS: number) {
	return new Promise(resolve => setTimeout(resolve, timeMS))
}
