import * as Agenda from 'agenda'
import config from '../config'
import { Connection } from 'mongoose'

export default ({ mongoConnection }: { mongoConnection: Connection }) => {
    return new Agenda({
        mongo: mongoConnection.db,
        db: { collection: config.agenda.collection },
        processEvery: config.agenda.poolTime,
        maxConcurrency: config.agenda.concurrency,
    })
}