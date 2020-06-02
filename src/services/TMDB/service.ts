import { Service, Inject } from 'typedi'
import axios, { AxiosInstance } from 'axios'
import * as winston from 'winston'
import { ReturnModelType } from '@typegoose/typegoose'

import config from '../../config'

import { Movie } from '../../models/movie/Movie'
import { Company } from '../../models/movie/Company'
import { Genre } from '../../models/movie/Genre'
import { Credit } from '../../models/movie/Credit'
import { Keyword } from '../../models/movie/Keyword'
import { Person } from '../../models/movie/Person'

@Service()
export class TMDBService {
    public baseUrl: string = 'https://api.themoviedb.org/3/'
    protected apiKey: string
    protected timeout: number = 15000
    protected axiosInstance: AxiosInstance
    @Inject('TMDBLogger')
    protected logger: winston.Logger

    @Inject('MovieDB MovieModel')
    protected MovieModel: ReturnModelType<typeof Movie>
    @Inject('MovieDB PersonModel')
    protected PersonModel: ReturnModelType<typeof Person>
    @Inject('MovieDB CompanyModel')
    protected CompanyModel: ReturnModelType<typeof Company>
    @Inject('MovieDB GenreModel')
    protected GenreModel: ReturnModelType<typeof Genre>
    @Inject('MovieDB CreditModel')
    protected CreditModel: ReturnModelType<typeof Credit>
    @Inject('MovieDB KeywordModel')
    protected KeywordModel: ReturnModelType<typeof Keyword>

    constructor() {
        this.apiKey = config.tmdbApiKey
        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            params: {
                api_key: this.apiKey,
                language: 'en-US'
            },
            timeout: this.timeout
        })
    }
}
