import { Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import * as winston from 'winston'
import { UserService } from '../services/app/user'
import { UserPayload } from '../interfaces/User'

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
    const logger: winston.Logger = Container.get('AppLogger')
    const userServiceInstance = Container.get(UserService)

    try {
        if (!res.locals['payload']) {
            throw new Error('Invalid payload')
        }

        const payload = res.locals['payload'] as UserPayload
        await userServiceInstance.deleteUser(payload.id)

        return res.sendStatus(204)
    } catch (e) {
        logger.error('🔥 error ', e)
        return next(e)
    }
}
