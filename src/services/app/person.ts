import { Person } from '../../models/movie/Person'
import { Service, Inject } from 'typedi'
import { ReturnModelType } from '@typegoose/typegoose'
import * as winston from 'winston'
import { EventDispatcher, EventDispatcherInterface } from '../../decorators/eventDispatcher'
import events from '../../subscribers/events'

@Service()
export class PersonService {
    constructor(
        @Inject('MovieDB PersonModel')
        private PersonModel: ReturnModelType<typeof Person>,
        @Inject('AppLogger')
        private logger: winston.Logger,
        @EventDispatcher()
        private eventDispatcher: EventDispatcherInterface,
    ) {}

    public async find(id: string) {
        if (id.startsWith('tt')) {
            try {
                const movie = await this.PersonModel
                    .findByIMDB(id)
                    .select({ __v: 0, createdAt: 0, updatedAt: 0 })
                    .exec()
                return movie
            } catch (e) {
                throw e
            }
        }

        try {
            const tmdbId = Number(id)

            if (isNaN(tmdbId)) {
                throw new Error('Invalid id')
            }

            const movie = await this.PersonModel
                .findByTMDB(tmdbId)
                .select({ __v: 0, createdAt: 0, updatedAt: 0 })
                .exec()
            return movie
        } catch (e) {
            throw e
        }
    }

    public async getPopular(count?: string) {
        let defaultCount = 250

        if (count) {
            const c = Number(count)

            if (isNaN(c)) {
                throw new Error('Invalid count')
            }

            defaultCount = c
        }

        if (defaultCount > 250) {
            throw new Error('Max allowed count is 250')
        }

        try {
            const movies = await this.PersonModel
                .find({})
                .sort({ popularity: -1 })
                .limit(defaultCount)
                .select({
                    _id: 0,
                    tmdbId: 1,
                    imdbId: 1,
                    profilePath: 1,
                    popularity: 1,
                    name: 1
                })
                .exec()

            return movies
        } catch (e) {
            throw e
        }
    }
}