import { Types } from 'mongoose'
import { DocumentType } from '@typegoose/typegoose'
import { AxiosResponse } from 'axios'
import { Service } from 'typedi'

import { TMDBService } from './service'
import * as TMDB from '../../interfaces/TMDB'

import { Movie, MovieTranslation } from '../../models/movie/Movie'
import { CreditCast, Credit } from '../../models/movie/Credit'
import { Person } from '../../models/movie/Person'

type movieResponseData = TMDB.Response.Movie.Details &
    { alternative_titles: Pick<TMDB.Response.Movie.AlternativeTitles, 'titles'> } &
    { credits: Pick<TMDB.Response.Movie.Credits, 'cast' | 'crew'> } &
    { keywords: Pick<TMDB.Response.Movie.Keywords, 'keywords'> } &
    { translations: Pick<TMDB.Response.Movie.Translations, 'translations'> }

@Service()
export default class MovieService extends TMDBService {
    constructor() {
        super()
    }

    public async get(id: Movie['tmdbId'] | 'latest') {
        try {
            const movie: AxiosResponse<movieResponseData> = await this.axiosInstance.get(`/movie/${id}`, {
                params: {
                    append_to_response: [
                        'alternative_titles',
                        'credits',
                        'keywords',
                        'translations'
                    ].join(',')
                }
            })
    
            return movie.data
        } catch (e) {
            if (e.response) {
                const responseData: TMDB.Response.Error = e.response.data

                if (e.response.status === 404 && responseData.status_code === 34) {
                    return null
                }

                throw e
            } else {
                this.logger.error(`Can't load Movie: ${id} `, e)
                throw e
            }
        }
    }

    public async normalizeGenres(
        detailsGenres: TMDB.Response.Movie.Details['genres']
    ) {
        return Promise.all(
            detailsGenres.map(async (genre) => {
                const document = await this.GenreModel.findOrCreate({
                    tmdbId: genre.id,
                    name: genre.name
                })
    
                return Types.ObjectId(document._id)
            })
        )
    }

    public async normalizeCompanies(
        detailsCompanies: TMDB.Response.Movie.Details['production_companies']
    ) {
        return Promise.all(
            detailsCompanies.map(async (company) => {
                const document = await this.CompanyModel.findOrCreate({
                    tmdbId: company.id,
                    originCountry: company.origin_country,
                    name: company.name,
                    logoPath: company.logo_path
                })
    
                return Types.ObjectId(document._id)
            })
        )
    }
    
    public normalizeCountries(
        countries: TMDB.Response.Movie.Details['production_countries']
    ) {
        return countries.map(country => country.iso_3166_1) as Movie['productionCountries']
    }
    
    public normalizeLanguages(
        languages: TMDB.Response.Movie.Details['spoken_languages']
    ) {
        return languages.map(lang => lang.iso_639_1) as Movie['spokenLangs']
    }
    
    public normalizeTitles(
        titles: TMDB.Response.Movie.AlternativeTitles['titles']
    ) {
        return titles as Movie['titles']
    }
    
    public async normalizeKeywords(
        keywords: TMDB.Response.Movie.Keywords['keywords']
    ) {
        return Promise.all(
            keywords.map(async (keyword) => {
                const document = await this.KeywordModel.findOrCreate({
                    tmdbId: keyword.id,
                    name: keyword.name
                })
    
                return Types.ObjectId(document._id)
            })
        )
    }
    
    public normalizeTranslations(
        translations: TMDB.Response.Movie.Translations['translations']
    ) {
        return translations.map((translation) => {
            return {
                iso_3166_1: translation.iso_3166_1,
                iso_639_1: translation.iso_639_1,
                name: translation.name,
                data: translation.data
            } as MovieTranslation
        }) as Movie['translations']
    }
    
    public async normalize(
        details: TMDB.Response.Movie.Details,
        titles: Pick<TMDB.Response.Movie.AlternativeTitles, 'titles'>,
        keywords: Pick<TMDB.Response.Movie.Keywords, 'keywords'>,
        translations: Pick<TMDB.Response.Movie.Translations, 'translations'>
    ) {
        const nGenres = await this.normalizeGenres(details.genres)
        const nCompanies = await this.normalizeCompanies(details.production_companies)
        const nCountries = this.normalizeCountries(details.production_countries)
        const nLanguages = this.normalizeLanguages(details.spoken_languages)
        const nTitles = this.normalizeTitles(titles.titles)
        const nKeywords = await this.normalizeKeywords(keywords.keywords)
        const nTranslations = this.normalizeTranslations(translations.translations)
    
        return {
            adult: details.adult,
            backdropPath: details.backdrop_path,
            budget: details.budget,
            genres: nGenres,
            homepage: details.homepage,
            tmdbId: details.id,
            imdbId: details.imdb_id,
            originalLang: details.original_language,
            originalTitle: details.original_title,
            overview: details.overview,
            popularity: details.popularity,
            posterPath: details.poster_path,
            productionCompanies: nCompanies,
            productionCountries: nCountries,
            releaseDate: details.release_date,
            revenue: details.revenue,
            runtime: details.runtime,
            spokenLangs: nLanguages,
            status: details.status,
            tagline: details.tagline,
            title: details.title,
            voteAvg: details.vote_average,
            voteCount: details.vote_count,
            titles: nTitles,
            keywords: nKeywords,
            translations: nTranslations
        } as Movie
    }
    
    public getPersonsIdsFromCredits(
        credits: TMDB.Response.Movie.Credits
    ) {
        return [...credits.cast.map(credit => credit.id), ...credits.crew.map(credit => credit.id)]
    }
    
    public normalizeCreditsToPersons(
        credits: Pick<TMDB.Response.Movie.Credits, 'cast' | 'crew'>
    ) {
        return [...credits.cast, ...credits.crew].map((credit) => {
            return {
                tmdbId: credit.id,
                name: credit.name,
                profilePath: credit.profile_path,
                gender: credit.gender
            } as Person
        })
    }
    
    public normalizeCredits(
        movie: DocumentType<Movie>,
        persons: DocumentType<Person>[],
        credits: Pick<TMDB.Response.Movie.Credits, 'cast' | 'crew'>
    ) {
        const cast = credits.cast.map((credit) => {
            return {
                creditType: 'cast',
                department: 'Acting',
                job: 'Actor',
                cast: {
                    character: credit.character,
                    order: credit.order
                } as CreditCast,
                media: movie._id,
                person: persons.find(person => person.tmdbId === credit.id)
            } as Credit
        })
    
        const crew = credits.crew.map((credit) => {
            return {
                creditType: 'crew',
                department: credit.department,
                job: credit.job,
                cast: null,
                media: movie._id,
                person: persons.find(person => person.tmdbId === credit.id)
            } as Credit
        })
    
        return [...cast, ...crew]
    }
    
    // Need to check credits and remove or update if outdated
    /* public async getAndUpdate(id: Movie['tmdbId']) {
        try {
            this.logger.debug(`Finding Movie ${id}`)
            const candidate = await this.MovieModel.findByTMDB(id)
    
            if (!candidate) {
                this.logger.debug(`Movie ${id} is not found in database`)
                return null
            }
    
            this.logger.debug('Movie found')

            const movieResponse = await this.get(id)

            if (!movieResponse) {
                return null
            }

            const {
                alternative_titles,
                credits,
                keywords,
                translations,
                ...details
            } = movieResponse
            const instance = await this.normalize(
                details,
                alternative_titles,
                keywords,
                translations,
            )
            this.logger.info('Person loaded')

            await this.PersonModel.findByIdAndUpdate(candidate._id, normalizedPerson).exec()
            this.logger.info('Person updated')

            this.logger.debug('Person is full')
        } catch (e) {
            this.logger.error(`Can't get and update movie ${id} `, e)
            throw e
        }
    } */

    public async getAndCreate(id: Movie['tmdbId']) {
        try {
            const movieResponse = await this.get(id)

            if (!movieResponse) {
                return null
            }

            const {
                alternative_titles,
                credits,
                keywords,
                translations,
                ...details
            } = movieResponse
    
            const instance = await this.normalize(
                details,
                alternative_titles,
                keywords,
                translations,
            )
            const document = await this.MovieModel.findOrCreate(instance)
            this.logger.info('Movie created')
    
            const personInstances = this.normalizeCreditsToPersons(credits)
            const personDocuments = await Promise.all(
                personInstances.map(instance => this.PersonModel.findOrCreate(instance))
            )
            this.logger.info('Persons created')
            
            const creditInstances = this.normalizeCredits(
                document,
                personDocuments,
                credits
            )
    
            // If document exists it will be returned else it will be created and returned
            await Promise.all(
                creditInstances.map(instance => this.CreditModel.findOrCreate(instance))
            )
            this.logger.info('Credits created')
        } catch (e) {
            this.logger.error(`Can't get and create movie ${id} `, e)
            throw e
        } finally {
            this.logger.debug('==============================')
        }
    }
    
    /**
     * @todo batchUpdate get movie changes and update them in database
     */

    // Add new movies
    public async batchCreate() {
        this.logger.debug('Loading latest movie')
        let latestMovie: movieResponseData

        try {
            latestMovie = await this.get('latest')
        } catch (e) {
            this.logger.error(e)
            return
        }
        const latestMovieId = latestMovie.id
        this.logger.debug(`Latest movie ${latestMovieId} is loaded`)
        this.logger.debug('Finding latest movie in DB')
        const latestMovieDB = await this.MovieModel.findLatestTMDB()
        let lastId: Movie['tmdbId'] = 0
    
        if (latestMovieDB) {
            lastId = latestMovieDB.tmdbId
            this.logger.debug(`Latest movie is found, ID: ${lastId}`)
        } else {
            this.logger.debug(`Latest movie is null, ID: ${lastId}`)
        }
    
        let perIteration = 4
        let i = lastId + 1
    
        while (i <= latestMovieId) {
            this.logger.info(`Current movie: ${i}/${latestMovieId}`)
            let promises: Promise<any>[] = []
            
            for (let movieId = i; movieId < i + perIteration; movieId++) {
                promises.push(
                    this.getAndCreate(movieId)
                        .then(
                            res => ({ success: true, id: movieId, response: res })
                        )
                        .catch(
                            e => ({ success: false, id: movieId, error: e })
                        )
                )
            }
    
            type promiseResult = { success: boolean, id: number } &
                ({ response: any, error?: never } | { response?: never, error: any })
            type errorResult = Omit<promiseResult, 'response'>
    
            const results: promiseResult[] = await Promise.all(promises)
            const errors: errorResult[] = results.filter(result => result.error)
    
            if (errors) {
                try {
                    await Promise.all(errors.map(movie => this.getAndCreate(movie.id)))
                } catch (e) {
                    this.logger.error(e)
                    return
                }
            }
            
            if (i + perIteration > latestMovieId) {
                perIteration = (i + perIteration) - latestMovieId
            }

            i += perIteration
            this.logger.debug('==============================')
        }
    }
    
}
