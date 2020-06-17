import * as dotenv from 'dotenv'

process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const envFound = dotenv.config()
if (envFound.error) {
    throw new Error(`⚠️ Couldn't find .env file ⚠️`)
}

export default {
    mongoMainURI: process.env.MONGO_MAIN,
    mongoMovieURI: process.env.MONGO_MOVIE,
    tmdbApiKey: process.env.TMDB_API_KEY,
    jwtSecret: process.env.JWT_SECRET,
    logs: {
        level: process.env.LOG_LEVEL || 'silly'
    },
    agenda: {
        collection: process.env.AGENDA_COLLECTION,
        poolTime: process.env.AGENDA_POOL_TIME,
        concurrency: parseInt(process.env.AGENDA_CONCURRENCY, 10)
    },
    api: {
        prefix: '/api'
    },
    port: parseInt(process.env.PORT),
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    },
    recommendations: {
        apiUrl: process.env.RECOMMENDATION_SERVER
    }
}