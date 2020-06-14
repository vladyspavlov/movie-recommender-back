import { Movie } from '../../models/movie/Movie'
import { Service, Inject } from 'typedi'
import { ReturnModelType } from '@typegoose/typegoose'
import * as winston from 'winston'
import { EventDispatcher, EventDispatcherInterface } from '../../decorators/eventDispatcher'
import events from '../../subscribers/events'

@Service()
export class MovieService {
    constructor(
        @Inject('MovieDB MovieModel')
        private MovieModel: ReturnModelType<typeof Movie>,
        @Inject('AppLogger')
        private logger: winston.Logger,
        @EventDispatcher()
        private eventDispatcher: EventDispatcherInterface,
    ) {}

    public async find(id: string) {
        if (id.startsWith('tt')) {
            try {
                const movie = await this.MovieModel
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

            const movie = await this.MovieModel
                .findByTMDB(tmdbId)
                .select({ __v: 0, createdAt: 0, updatedAt: 0 })
                .exec()
            return movie
        } catch (e) {
            throw e
        }
    }

    public async search(text: string) {
        const regex = new RegExp('.*' + text + '.*', 'i')

        try {
            return await this.MovieModel
            .find({
                $or: [
                    { title: regex },
                    { 'translations.data.title': regex }
                ]
            })
            .sort({ popularity: -1 })
            .limit(100)
            .select({ __v: 0, createdAt: 0, updatedAt: 0 })
            .exec()
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
            const movies = await this.MovieModel
                .find({})
                .sort({ popularity: -1 })
                .limit(defaultCount)
                .select({
                    tmdbId: 1,
                    imdbId: 1,
                    posterPath: 1,
                    popularity: 1,
                    originalTitle: 1,
                    title: 1,
                    translations: 1
                })
                .exec()

            return movies
        } catch (e) {
            throw e
        }
    }
}