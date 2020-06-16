import { loadGraphModel } from '@tensorflow/tfjs-node'
import { logger } from './logger'

export default async ({ modelUrl }: { modelUrl: string }) => {
    try {
        return await loadGraphModel(modelUrl)
    } catch (e) {
        logger.error('🔥 Error on dependency injector loader: %o', e)
        throw e
    }
}
