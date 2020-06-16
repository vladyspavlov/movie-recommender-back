import 'reflect-metadata'
import config from './config'
import * as express from 'express'
import { logger } from './loaders/logger'
import loader from './loaders'
import * as fs from 'fs'
import * as https from 'https'

async function start() {
    const app = express()

    await loader({ expressApp: app })

    https.createServer({
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cer')
    }, app)
    .listen(config.port, () => {
        /* if (e) { 
            logger.error(e)
            process.exit(1)
        } */

        logger.info(`
        ################################################
        🛡️  Server listening on port: ${config.port}  🛡️ 
        ################################################
        `)
    })
}

start()
