export type Dictionary<V> = { [key: string]: V }

export function sleep(timeMS: number) {
	return new Promise(resolve => setTimeout(resolve, timeMS))
}

export function clamp(x: number | bigint, a: number | bigint, b: number | bigint) {
	return x < a ? a : x > b ? b : x
}

export function* iterableOf<A>(xs: Iterator<A>) {
	let x = xs.next()
	while (!x.done) {
		yield x.value
		x = xs.next()
	}
}

export function* flatten<T>(xss: Iterable<Iterable<T>>): Generator<T> {
	for (const xs of xss) {
		for (const x of xs) {
			yield x
		}
	}
}
