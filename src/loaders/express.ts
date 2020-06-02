import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import { logger } from './logger'
import config from '../config'
import { useExpressServer, useContainer, Action } from 'routing-controllers'
import { Container } from 'typedi'
import { AuthService } from '../services/app/AuthService'

// Express Middlewares
import '../middlewares/ErrorHandler'

// Express Interceptors
import '../interceptors/ResponseInterceptor'

export default ({ app }: { app: express.Application }) => {
    /**
     * Health Check endpoints
     * @TODO Explain why they are here
     */
    app.get('/status', (req, res) => {
        res.status(200).end()
    })
    app.head('/status', (req, res) => {
        res.status(200).end()
    })

    // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // It shows the real origin IP in the heroku or Cloudwatch logs
    app.enable('trust proxy')

    // Middleware that transforms the raw string of req.body into json
    app.use(bodyParser.json())
    // Middleware for handling req.cookies
    app.use(cookieParser())

    useContainer(Container)

    // Load API routes
    useExpressServer(app, {
        cors: true,
        routePrefix: config.api.prefix,
        controllers: [ `${__dirname}/../controllers/*.js` ],
        // Maybe move to service ?
        authorizationChecker: async (action: Action, roles: string[]) => {
            //return true
            // here you can use request/response objects from action
            // also if decorator defines roles it needs to access the action
            // you can use them to provide granular access check
            // checker must return either boolean (true or false)
            // either promise that resolves a boolean value
            // demo code:
            
            const authorization: string = action.request.headers['authorization']
            const signature: string = action.request.cookies['signature']

            // Assume that all users is guests,
            // so we can use Authorized decorator with guests
            if (roles.includes('GUEST') && !authorization) {
                return true
            }

            if (!authorization && !signature) {
                return false
            }

            const parts = authorization.split(' ')
            let token: string

            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1]
            }

            const jwt = token + signature
            const AuthServiceInstance = Container.get(AuthService)

            try {
                const payload = await AuthServiceInstance.verifyJWT(jwt)
                return true
            } catch (e) {
                if (
                    e.name === 'TokenExpiredError' ||
                    e.name === 'JsonWebTokenError' ||
                    e.name === 'NotBeforeError'
                ) {
                    return false
                }

                logger.error(e)
                throw e
            }
        },
        defaultErrorHandler: false
    })

    /// catch 404 and forward to error handler
    /* app.use((req, res, next) => {
        const err = new Error('Not Found')
        err['status'] = 404
        next(err)
    }) */
}