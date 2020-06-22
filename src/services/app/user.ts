import { User } from '../../models/app/User'
import { Seen } from '../../models/app/Seen'
import { Service, Inject } from 'typedi'
import { ReturnModelType, DocumentType } from '@typegoose/typegoose'
import * as winston from 'winston'
import { EventDispatcher, EventDispatcherInterface } from '../../decorators/eventDispatcher'
import events from '../../subscribers/events'
import { Types, isValidObjectId } from 'mongoose'
import { omit, countBy, flatten, forEach as _forEach } from 'lodash'
import { Movie } from '../../models/movie/Movie'

@Service()
export class UserService {
    constructor(
        @Inject('AppDB UserModel')
        private UserModel: ReturnModelType<typeof User>,
        @Inject('AppDB SeenModel')
        private SeenModel: ReturnModelType<typeof Seen>,
        @Inject('MovieDB MovieModel')
        private MovieModel: ReturnModelType<typeof Movie>,
        @Inject('AppLogger')
        private logger: winston.Logger,
        @EventDispatcher()
        private eventDispatcher: EventDispatcherInterface,
    ) {}

    public async deleteUser(id: Types.ObjectId) {
        try {
            const userDocument = await this.UserModel
                .findByIdAndDelete(id)
                .exec()
            await this.SeenModel
                .deleteMany({
                    user: userDocument._id
                })
                .exec()
        } catch (e) {
            throw e
        }
    }

    public async getSeenMovies(userId: Types.ObjectId) {
        try {
            const seen = await this.SeenModel
                .find({
                    user: userId
                })
                .select({
                    user: 0,
                    __v: 0,
                    createdAt: 0,
                    updatedAt: 0
                })
                .exec()
            
            return await Promise.all(seen.map(async (doc) => {
                const movie = await this.MovieModel
                    .findById(doc.media)
                    .select({
                        _id: 0,
                        title: 1,
                        posterPath: 1
                    })
                    .exec()
                
                return { ...doc.toJSON(), ...movie.toJSON() }
            }))
        } catch (e) {
            throw e
        }
    }

    public async addSeenMovie(
        userId: Types.ObjectId,
        mediaId: Types.ObjectId,
        score: number
    ) {
        if (isNaN(score)) {
            throw new Error('Bad score')
        }

        const fieldsToOmit = ['__v', 'createdAt', 'updatedAt', 'user']

        try {
            const seen = await this.SeenModel.create({
                user: userId,
                media: mediaId,
                score
            })

            const movie = await this.MovieModel
                .findById(mediaId)
                .select({
                    _id: 0,
                    title: 1,
                    posterPath: 1
                })
                .exec()

            return Object.assign(omit(seen.toJSON(), fieldsToOmit), movie.toJSON())
        } catch (e) {
            if (e.code === 11000) {
                const err = new Error('User already seen this movie')
                err['status'] = 409
                throw err
            }

            throw e
        }
    }

    public async deleteSeenMovie(seenId: Types.ObjectId) {
        try {
            await this.SeenModel
                .findByIdAndDelete(seenId)
                .exec()
        } catch (e) {
            throw e
        }
    }

    public async updateSeenMovie(seenId: Types.ObjectId, score: number) {
        if (isNaN(score)) {
            throw new Error('Bad score')
        }

        try {
            return await this.SeenModel
                .findByIdAndUpdate(seenId, {
                    $set: {
                        score
                    }
                }, {
                    new: true
                })
                .select({
                    __v: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    user: 0
                })
                .exec()
        } catch (e) {
            throw e
        }
    }

    public async getRecommendations(
        userId: string,
        limit: number
    ) {
        if (!isValidObjectId(userId)) {
            throw new Error('Invalid Id')
        }

        try {
            // Get rated movies
            const seenMovies: Pick<Seen, 'media' | 'score'>[] = await this.SeenModel
                .aggregate([
                    { $match: {
                        user: Types.ObjectId(userId)
                    } },
                    { $project: {
                        _id: 0,
                        media: 1,
                        score: 1
                    } }
                ])
                .exec()

            if (seenMovies.length === 0) {
                return []
            }

            const movieScore = Object.fromEntries(
                seenMovies.map(seen => [ seen.media, seen.score ])
            )

            // Get rated movies id
            const seenMoviesIds = seenMovies.map(m => m.media)
            // Get movie keywords by movie id
            type moviesInfo = Pick<DocumentType<Movie>, '_id' | 'genres' | 'keywords'>
            const moviesInfo: moviesInfo[] = await this.MovieModel
                .aggregate([
                    { $match: {
                        _id: {
                            $in: seenMoviesIds
                        }
                    } },
                    { $project: {
                        _id: 1,
                        genres: 1,
                        keywords: 1
                    } }
                ])
                .exec()

            const moviesInfoScore = moviesInfo.map(m => {
                m['score'] = movieScore[m._id]
                return m
            })

            const scores = moviesInfoScore.map(m => {
                const keywordsScore = m.keywords.map(k => [ k.toString(), m['score'] ])
                const genresScore = m.genres.map(g => [ g.toString(), m['score'] ])
                return [ keywordsScore, genresScore ]
            })
            

            const keywordsScores: { [ key: string ]: number } = {}
            const genresScores: { [ key: string ]: number } = {}

            for (const movie of scores) {
                for (const keyword of movie[0]) {
                    if (keyword[0] in keywordsScores === false) {
                        keywordsScores[keyword[0]] = 0    
                    }

                    keywordsScores[keyword[0]] += keyword[1]
                }

                for (const genre of movie[1]) {
                    if (genre[0] in genresScores === false) {
                        genresScores[genre[0]] = 0
                    }
                    
                    genresScores[genre[0]] += genre[1]
                }
            }

            // combine keywords of all movies to one array
            const keywordsArr = flatten(moviesInfo.map(m => m.keywords))
            const genresArr = flatten(moviesInfo.map(m => m.genres))
            // count keyword frequency
            const keywordsFrequency = countBy(keywordsArr)
            const genresFrequency = countBy(genresArr)
            
            // add score by keyword to frequency
            _forEach(keywordsFrequency, (freq, key) => {
                keywordsFrequency[key] += keywordsScores[key]
            })

            _forEach(genresFrequency, (freq, key) => {
                genresFrequency[key] += genresScores[key]
            })
            
            // Find all movies (except seen) that contains at least one of keywords or genres
            type matchedMovies = Pick<
                DocumentType<Movie>,
                '_id' | 'keywords' | 'genres' | 'title' | 'posterPath' | 'popularity'
            >
            const matchedMovies: matchedMovies[] = await this.MovieModel
                .aggregate([
                    { $match: {
                        $and: [
                            {
                                $and: [
                                    { keywords: { $in: keywordsArr } },
                                    { genres: { $in: genresArr } }
                                ]
                            },
                            { _id: { $nin: seenMoviesIds } },
                            { status: 'Released' }
                        ]
                    }},
                    { $project: {
                        _id: 1,
                        keywords: 1,
                        genres: 1,
                        title: 1,
                        posterPath: 1,
                        popularity: 1
                    } }
                ])
                .exec()

            // Movies in order of best similarity due to density and popularity
            const similarMovies = matchedMovies
                // find density for each movie
                .map(m => {
                    const keywordsDensity = m.keywords
                        .map(k => keywordsFrequency[(<string>k)]) // declare k as string
                        .filter(k => k) // filter undefined
                        .reduce((acc, cur) => (acc + cur), 0) // sum all densities of all keywords
                    const genresDensity = m.genres
                        .map(g => genresFrequency[(<string>g)])
                        .filter(g => g)
                        .reduce((acc, cur) => (acc + cur), 0)

                    const movieDensity = keywordsDensity + genresDensity
                    
                    return [
                        m._id,
                        movieDensity,
                        m.popularity,
                        m.title,
                        m.posterPath
                    ] as [
                        string,
                        number,
                        number,
                        string,
                        string
                    ]
                })
                // sort by density and popularity
                .sort((a, b) => (b[1] - a[1]) || (b[2] - a[2]))
                .slice(0, limit)
                // Return array of ObjectId(movieId)
                .map(m => ({
                    _id: Types.ObjectId(m[0]),
                    title: m[3],
                    posterPath: m[4]
                }))

            return similarMovies
        } catch (e) {
            throw e
        }
    }
}