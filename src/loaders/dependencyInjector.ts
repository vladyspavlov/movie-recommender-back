import { Container } from 'typedi'
import { Connection } from 'mongoose'
import { logger } from './logger'
import agendaFactory from './agenda'
import * as winston from 'winston'
import tfFactory from './tensorflow'

/**
 * @todo Add ReturnModelType for model property
 */

type params = {
    mongoConnection: Connection,
    models: {
        name: string,
        model: object
    }[],
    loggers: {
        name: string,
        logger: winston.Logger
    }[],
    tfModels: {
        name: string,
        model: object
    }[]
}

export default (
    { mongoConnection, models, loggers, tfModels }: params
) => {
    try {
        models.forEach((m) => {
            Container.set(m.name, m.model)
        })

        logger.info('✌️ Models injected into container')

        loggers.forEach((l) => {
            Container.set(l.name, l.logger)
        })

        logger.info('✌️ Loggers injected into container')

        tfModels.forEach((m) => {
            Container.set(m.name, m.model)
        })

        logger.info('✌️ Tensorflow models injected into container')

        const agendaInstance = agendaFactory({ mongoConnection })

        Container.set('agendaInstance', agendaInstance)

        logger.info('✌️ Agenda injected into container')

        return { agenda: agendaInstance }
    } catch (e) {
        logger.error('🔥 Error on dependency injector loader: %o', e)
        throw e
    }
}