import { Movie } from '../../models/movie/Movie'
import { Credit } from '../../models/movie/Credit'
import { Service, Inject } from 'typedi'
import { ReturnModelType } from '@typegoose/typegoose'
import { isValidObjectId, Types } from 'mongoose'
import * as winston from 'winston'
import { EventDispatcher, EventDispatcherInterface } from '../../decorators/eventDispatcher'
import events from '../../subscribers/events'

@Service()
export class MovieService {
    constructor(
        @Inject('MovieDB MovieModel')
        private MovieModel: ReturnModelType<typeof Movie>,
        @Inject('MovieDB CreditModel')
        private CreditModel: ReturnModelType<typeof Credit>,
        @Inject('AppLogger')
        private logger: winston.Logger,
        @EventDispatcher()
        private eventDispatcher: EventDispatcherInterface,
    ) { }

    public async find(id: string) {
        try {
            let condition = {}

            if (isValidObjectId(id)) {
                condition = { _id: Types.ObjectId(id) }
            } else if (!isNaN(Number(id))) {
                condition = { tmdbId: Number(id) }
            } else if (id.startsWith('tt')) {
                condition = { imdbId: id }
            } else {
                throw new Error('Invalid Id')
            }

            return await this.MovieModel
                .aggregate([
                    { $match: condition },
                    {
                        $lookup: {
                            from: 'keywords',
                            localField: 'keywords',
                            foreignField: '_id',
                            as: 'keywords'
                        }
                    },
                    { $addFields: { keywords_temp: '$keywords.name' } },
                    { $project: { keywords: 0 } },
                    { $addFields: { keywords: '$keywords_temp' } },
                    { $project: { keywords_temp: 0 } },
                    {
                        $lookup: {
                            from: 'genres',
                            localField: 'genres',
                            foreignField: '_id',
                            as: 'genres'
                        }
                    },
                    { $addFields: { genres_temp: '$genres.name' } },
                    { $project: { genres: 0 } },
                    { $addFields: { genres: '$genres_temp' } },
                    { $project: { genres_temp: 0 } },
                    {
                        $project: {
                            __v: 0,
                            createdAt: 0,
                            updatedAt: 0
                        }
                    }
                ])
                .exec()
        } catch (e) {
            throw e
        }
    }

    public async findCredits(id: string) {
        try {
            if (!isValidObjectId(id)) {
                throw new Error('Invalid Id')
            }

            return await this.CreditModel
                .aggregate([
                    { $match: { media: Types.ObjectId(id) } },
                    {
                        $lookup: {
                            from: 'people',
                            localField: 'person',
                            foreignField: '_id',
                            as: 'info'
                        }
                    },
                    { $unwind: { path: '$info' } },
                    {
                        $project: {
                            _id: '$info._id',
                            creditType: 1,
                            department: 1,
                            job: 1,
                            cast: 1,
                            name: '$info.name',
                            profilePath: '$info.profilePath',
                            tmdbId: '$info.tmdbId',
                            imdbId: '$info.imdbId'
                        }
                    }
                ])
                .exec()
        } catch (e) {
            throw e
        }
    }

    public async findRelated(id: string, limit: number) {
        try {
            if (!isValidObjectId(id)) {
                throw new Error('Invalid Id')
            }

            const keywords: Pick<Movie, 'keywords'>[] = await this.MovieModel
                .aggregate([
                    { $match: { _id: Types.ObjectId(id) } },
                    { $project: {
                        _id: 0,
                        keywords: 1
                    } }
                ])
                .exec()
            
            const related = await this.MovieModel
                .aggregate([
                    { $match: 
                        {
                            $and: [
                                { keywords: { $in: keywords[0].keywords } },
                                { _id: { $ne: Types.ObjectId(id) } }
                            ]
                        }
                    },
                    { $sort: { popularity: -1 } },
                    { $limit: limit },
                    { $project: {
                        _id: 1,
                        title: 1,
                        posterPath: 1
                    } }
                ])
                .exec()

            return related
        } catch (e) {
            throw e
        }
    }

    public async search(text: string) {
        const regex = new RegExp('.*' + text + '.*', 'i')

        try {
            return await this.MovieModel
                .aggregate([
                    { $match: {
                        $and: [
                            {
                                $or: [
                                    { title: regex },
                                    { 'translations.data.title': regex }
                                ]
                            },
                            { adult: false }
                        ]
                    } },
                    { $sort: {
                        popularity: -1
                    } },
                    { $limit: 100 },
                    { $project:{
                        __v: 0,
                        createdAt: 0,
                        updateAt: 0
                    } }
                ])
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