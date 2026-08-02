import { DEFAULT_CONNECTION_CONFIG } from '../Defaults'
import type { UserFacingSocketConfig } from '../Types'
import { installConsoleFilter } from '../Utils/console-filter'
import { printBanner } from '../Utils/banner'
import { makeCommunitiesSocket } from './communities'


const makeWASocket = (config: UserFacingSocketConfig) => {
	installConsoleFilter()
	printBanner()

	const newConfig = {
		...DEFAULT_CONNECTION_CONFIG,
		...config
	}

	if (config.version && config.syncWaWebVersion === undefined) {
		newConfig.syncWaWebVersion = false
	}

	if (!newConfig.version) {
		newConfig.version = DEFAULT_CONNECTION_CONFIG.version
	}

	return makeCommunitiesSocket(newConfig)
}

export default makeWASocket
