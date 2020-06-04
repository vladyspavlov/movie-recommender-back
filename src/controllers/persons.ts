import { Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import * as winston from 'winston'
import { PersonService } from '../services/app/person'

export async function getOne(req: Request, res: Response, next: NextFunction) {
    const logger: winston.Logger = Container.get('AppLogger')
    const personServiceInstance = Container.get(PersonService)

    const id = req.params.id as string

    try {
        const person = await personServiceInstance.find(id)
        res.locals['status'] = 200
        res.locals['response'] = {
            person
        }
        return next()
    } catch (e) {
        logger.error('🔥 error ', e)
        return next(e)
    }
}

export async function getPopular(req: Request, res: Response, next: NextFunction) {
    const logger: winston.Logger = Container.get('AppLogger')
    const personServiceInstance = Container.get(PersonService)

    try {
        const persons = await personServiceInstance.getPopular(req.query.count as string | null)
        res.locals['status'] = 200
        res.locals['response'] = {
            persons
        }
        return next()
    } catch (e) {
        logger.error('🔥 error ', e)
        return next(e)
    }
}
