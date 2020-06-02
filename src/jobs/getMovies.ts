import { Container } from 'typedi'
import TMDB from '../services/TMDB'
import * as winston from 'winston'

export default async function handler(job, done) {
    const logger: winston.Logger = Container.get('AgendaLogger')

    try {
        logger.debug('getMovie Job triggered!')
        const movieServiceInstance = Container.get(TMDB.MovieService)
        await movieServiceInstance.batchCreate()
        done()
    } catch (e) {
        logger.error('Error with getMovie Job ', e)
        done(e)
    }
}