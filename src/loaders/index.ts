import { getModelForClass } from '@typegoose/typegoose'
import * as mongooseLoader from './mongoose'
import dependencyInjectorLoader from './dependencyInjector'
import createLogger, { logger } from './logger'
import jobsLoader from './jobs'
import expressLoader from './express'
import './events'
//import TMDB from '../services/TMDB'

// Models schemas
import { User } from '../models/app/User'
import { Movie as UserMovie } from '../models/app/Movie'

import { Movie } from '../models/movie/Movie'
import { Person } from '../models/movie/Person'
import { Company } from '../models/movie/Company'
import { Credit } from '../models/movie/Credit'
import { Keyword } from '../models/movie/Keyword'
import { Genre } from '../models/movie/Genre'

export default async function ({ expressApp }) {
    const loggerNames = [
        'AppLogger',
        'TMDBLogger',
        'AgendaLogger',
        'ExpressLogger',
        'MongoMovieLogger',
        'MongoAppLogger'
    ]

    const loggers = loggerNames.map(name => ({ name, logger: createLogger(name) }))

    const movieDBConnection = await mongooseLoader.MovieDB()
    logger.info('✌️ Movie DB connected!')
    const appDBConnection = await mongooseLoader.AppDB()
    logger.info('✌️ App DB connected!')

    const models = [
        { name: `AppDB ${User.name}Model`, model: getModelForClass(User, { existingConnection: appDBConnection }) },
        { name: `AppDB ${UserMovie.name}Model`, model: getModelForClass(UserMovie, { existingConnection: appDBConnection }) },
        // ====================
        { name: `MovieDB ${Movie.name}Model`, model: getModelForClass(Movie, { existingConnection: movieDBConnection }) },
        { name: `MovieDB ${Person.name}Model`, model: getModelForClass(Person, { existingConnection: movieDBConnection }) },
        { name: `MovieDB ${Company.name}Model`, model: getModelForClass(Company, { existingConnection: movieDBConnection }) },
        { name: `MovieDB ${Credit.name}Model`, model: getModelForClass(Credit, { existingConnection: movieDBConnection }) },
        { name: `MovieDB ${Keyword.name}Model`, model: getModelForClass(Keyword, { existingConnection: movieDBConnection }) },
        { name: `MovieDB ${Genre.name}Model`, model: getModelForClass(Genre, { existingConnection: movieDBConnection }) },
    ]

    const { agenda } = dependencyInjectorLoader({
        mongoConnection: appDBConnection,
        models,
        loggers
    })

    logger.info('✌️ Dependency Injector loaded')

    jobsLoader({ agenda })
    
    logger.info('✌️ Jobs loaded')

    expressLoader({ app: expressApp })

    logger.info('✌️ Express loaded')
}