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

export function* kvs<A>(dictionary: Dictionary<A>): Generator<[string, A]> {
	for (const key in dictionary) {
		yield [key, dictionary[key]]
	}
}

export function* values<A>(dictionary: Dictionary<A>): Generator<A> {
	for (const key in dictionary) {
		yield dictionary[key]
	}
}

export function* ivs<A>(array: A[]): Generator<[number, A]> {
	for (let i = 0; i < array.length; i++) {
		yield [i, array[i]]
	}
}

export class Color {
	r: number
	g: number
	b: number

	constructor(r: number, g: number, b: number) {
		this.r = r
		this.g = g
		this.b = b
	}

	toHexString() {
		let rs = (Math.floor(this.r * 255)).toString(16)
		if (rs.length === 1) rs = `0${rs}`
		let gs = (Math.floor(this.g * 255)).toString(16)
		if (gs.length === 1) gs = `0${gs}`
		let bs = (Math.floor(this.b * 255)).toString(16)
		if (bs.length === 1) bs = `0${bs}`
		return `#${rs}${gs}${bs}`
	}
}

export function colorFromInt(n: number) {
	const r = ((n & 0xff0000) >> 16) / 255
	const g = ((n & 0x00ff00) >>  8) / 255
	const b = ((n & 0x0000ff)      ) / 255
	return new Color(r, g, b)
}

export function colorFromAngle(t: number) {
	const tau = 2 * Math.PI
	t %= tau
	const t3OverTau = t * 3 / tau
	if (t3OverTau < 1) {
		return new Color(t3OverTau, 1 - t3OverTau, 0)
	}
	if (t3OverTau < 2) {
		return new Color(0, t3OverTau - 2, 2 - t3OverTau)
	}
	return new Color(2 - t3OverTau, 0, t3OverTau - 2)
}
