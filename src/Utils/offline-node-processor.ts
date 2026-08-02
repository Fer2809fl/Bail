import type { BinaryNode } from '../WABinary'

export type MessageType = 'message' | 'call' | 'receipt' | 'notification'

type OfflineNode = {
	type: MessageType
	node: BinaryNode
}

export type OfflineNodeProcessorDeps = {
	isWsOpen: () => boolean
	onUnexpectedError: (error: Error, msg: string) => void
	yieldToEventLoop: () => Promise<void>
}

export function makeOfflineNodeProcessor(
	nodeProcessorMap: Map<MessageType, (node: BinaryNode) => Promise<void>>,
	deps: OfflineNodeProcessorDeps,
	batchSize = 10
) {
	const nodes: OfflineNode[] = []
	let isProcessing = false

	const runLoop = () => {
		if (isProcessing) {
			return
		}

		if (!nodes.length || !deps.isWsOpen()) {
			return
		}

		isProcessing = true

		const promise = async () => {
			let processedInBatch = 0

			while (nodes.length && deps.isWsOpen()) {
				const { type, node } = nodes.shift()!

				const nodeProcessor = nodeProcessorMap.get(type)

				if (!nodeProcessor) {
					deps.onUnexpectedError(new Error(`unknown offline node type: ${type}`), 'processing offline node')
					continue
				}

				await nodeProcessor(node).catch(err => deps.onUnexpectedError(err, `processing offline ${type}`))
				processedInBatch++

				if (processedInBatch >= batchSize) {
					processedInBatch = 0
					await deps.yieldToEventLoop()
				}
			}

			isProcessing = false

			if (nodes.length && deps.isWsOpen()) {
				runLoop()
			}
		}

		promise().catch(error => {
			isProcessing = false
			deps.onUnexpectedError(error, 'processing offline nodes')
		})
	}

	const enqueue = (type: MessageType, node: BinaryNode) => {
		nodes.push({ type, node })
		runLoop()
	}

	const resume = () => {
		runLoop()
	}

	return { enqueue, resume }
}
