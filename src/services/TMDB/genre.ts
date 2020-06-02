import { Service } from 'typedi'

import * as TMDB from '../../interfaces/TMDB'
import { TMDBService } from './service'

@Service()
export default class GenreService extends TMDBService {
    constructor() {
        super()
    }

    async getGenresMovie() {
        try {
            const response = await this.axiosInstance.get(`genre/movie/list`)
            return response.data as TMDB.Response.Genre.Genres
        } catch (e) {
            this.logger.error(`Can't load Movie genres`, e)
            return null
        }
    }
    
    async getGenresTV() {
        try {
            const response = await this.axiosInstance.get(`genre/tv/list`)
            return response.data as TMDB.Response.Genre.Genres
        } catch (e) {
            this.logger.error(`Can't load TV genres`, e)
            return null
        }
    }
    
    async getAndCreateGenres() {
        try {
            this.logger.debug('Loading Movie genres')
            const genresResponseData = await this.getGenresMovie()
            if (!genresResponseData) {
                this.logger.debug('Movie genres is null')
                return
            }
            this.logger.debug('Movie genres is loaded')
            this.logger.silly('Find or create each from loaded genres in database')
            const genres = await Promise.all(
                genresResponseData.genres.map(genre => this.GenreModel.findOrCreate({
                    tmdbId: genre.id,
                    name: genre.name
                }))
            )
            this.logger.debug('Movie genre successfully returned')
            return genres
        } catch (e) {
            this.logger.error(`Can't find or create genres`, e)
            return null
        }
    }
    
}
