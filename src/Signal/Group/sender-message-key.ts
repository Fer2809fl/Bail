import { deriveSecrets } from 'libsignal/lib/crypto.js'

export class SenderMessageKey {
	private readonly iteration: number
	private readonly iv: Uint8Array
	private readonly cipherKey: Uint8Array
	private readonly seed: Uint8Array

	constructor(iteration: number, seed: Uint8Array) {
		const derivative = deriveSecrets(seed, Buffer.alloc(32), Buffer.from('WhisperGroup'))
		const first = derivative[0]
		const second = derivative[1]
		if (!first || !second) {
			throw new Error('Failed to derive sender message key secrets')
		}

		const keys = new Uint8Array(32)
		keys.set(new Uint8Array(first.slice(16)))
		keys.set(new Uint8Array(second.slice(0, 16)), 16)

		this.iv = Buffer.from(first.slice(0, 16))
		this.cipherKey = Buffer.from(keys.buffer)
		this.iteration = iteration
		this.seed = seed
	}

	public getIteration(): number {
		return this.iteration
	}

	public getIv(): Uint8Array {
		return this.iv
	}

	public getCipherKey(): Uint8Array {
		return this.cipherKey
	}

	public getSeed(): Uint8Array {
		return this.seed
	}
}
