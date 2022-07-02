export type Dictionary<V> = { [key: string]: V }

export function sleep(timeMS: number) {
	return new Promise(resolve => setTimeout(resolve, timeMS))
}

export function clamp(x: number | bigint, a: number | bigint, b: number | bigint) {
	return x < a ? a : x > b ? b : x
}