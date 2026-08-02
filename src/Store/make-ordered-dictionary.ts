export type OrderedDictionary<T> = {
	array: T[]
	get: (id: string) => T | undefined
	upsert: (item: T, mode: 'append' | 'prepend') => void
	update: (item: T) => boolean
	remove: (item: T) => boolean
	updateAssign: (id: string, update: Partial<T>) => boolean
	clear: () => void
	filter: (contain: (item: T) => boolean) => void
	toJSON: () => T[]
	fromJSON: (newItems: T[]) => void
}

export function makeOrderedDictionary<T>(idGetter: (item: T) => string): OrderedDictionary<T> {
	const array: T[] = []
	const dict: { [id: string]: T } = {}

	const get = (id: string) => dict[id]

	const update = (item: T) => {
		const id = idGetter(item)
		const idx = array.findIndex(i => idGetter(i) === id)
		if (idx >= 0) {
			array[idx] = item
			dict[id] = item
			return true
		}

		return false
	}

	const upsert = (item: T, mode: 'append' | 'prepend') => {
		const id = idGetter(item)
		if (get(id)) {
			update(item)
		} else {
			if (mode === 'append') {
				array.push(item)
			} else {
				array.splice(0, 0, item)
			}

			dict[id] = item
		}
	}

	const remove = (item: T) => {
		const id = idGetter(item)
		const idx = array.findIndex(i => idGetter(i) === id)
		if (idx >= 0) {
			array.splice(idx, 1)
			delete dict[id]
			return true
		}

		return false
	}

	return {
		array,
		get,
		upsert,
		update,
		remove,
		updateAssign: (id: string, update: Partial<T>) => {
			const item = get(id)
			if (item) {
				Object.assign(item, update)
				delete dict[id]
				dict[idGetter(item)] = item
				return true
			}

			return false
		},
		clear: () => {
			array.splice(0, array.length)
			for (const key of Object.keys(dict)) {
				delete dict[key]
			}
		},
		filter: (contain: (item: T) => boolean) => {
			let i = 0
			while (i < array.length) {
				const item = array[i] as T
				if (!contain(item)) {
					delete dict[idGetter(item)]
					array.splice(i, 1)
				} else {
					i += 1
				}
			}
		},
		toJSON: () => array,
		fromJSON: (newItems: T[]) => {
			array.splice(0, array.length, ...newItems)
			for (const key of Object.keys(dict)) {
				delete dict[key]
			}

			for (const item of newItems) {
				dict[idGetter(item)] = item
			}
		}
	}
}
