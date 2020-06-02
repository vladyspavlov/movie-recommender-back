import config from '../config'
import * as mongoose from 'mongoose'

const mongoConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}

export async function MovieDB() {
    return mongoose.createConnection(config.mongoMovieURI, mongoConfig)
}

export async function AppDB() {
    return mongoose.createConnection(config.mongoMainURI, mongoConfig)
}
