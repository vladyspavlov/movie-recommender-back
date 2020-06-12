import { Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import * as winston from 'winston'
import { MovieService } from '../services/app/movie'

export async function getOne(req: Request, res: Response, next: NextFunction) {
    const logger: winston.Logger = Container.get('AppLogger')
    const movieServiceInstance = Container.get(MovieService)

    const id = req.params.id as string

    try {
        const movie = await movieServiceInstance.find(id)

        return res
            .status(200)
            .json({
                movie
            })
    } catch (e) {
        logger.error('🔥 error ', e)
        return next(e)
    }
}

export async function getPopular(req: Request, res: Response, next: NextFunction) {
    const logger: winston.Logger = Container.get('AppLogger')
    const movieServiceInstance = Container.get(MovieService)

    try {
        const movies = await movieServiceInstance.getPopular(req.query.count as string | null)

        return res
            .json(200)
            .json({
                movies
            })
    } catch (e) {
        logger.error('🔥 error ', e)
        return next(e)
    }
}
