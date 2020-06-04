import { Application } from 'express'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import * as cors from 'cors'
import { logger } from './logger'
import config from '../config'
import routes from '../routes'

export default ({ app }: { app: Application }) => {
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

    // Enable CORS to all origins by default
    app.use(cors())
    // Middleware that transforms the raw string of req.body into json
    app.use(bodyParser.json())
    // Middleware for handling req.cookies
    app.use(cookieParser())

    // Load API routes
    app.use(config.api.prefix, routes())

    // Middleware for appending new jwt token to each successful request
    app.use((req, res) => {
        if (res.locals['token']) {
            return res
                .cookie('signature', res.locals['signature'], {
                    maxAge: 1000 * 60 * 60 * 24 * 30,
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                })
                .status(res.locals['status'])
                .json({
                    ...res.locals['response'],
                    token: res.locals['token']
                })
        }

        return res
            .clearCookie('signature')
            .status(res.locals['status'])
            .json(res.locals['response'])
    })

    // Middlewares for handling errors
    // Catch 404 and forward to error handler
    app.use((req, res, next) => {
        const err = new Error('Not found')
        err['status'] = 404
        return next(err)
    })

    // Handle JWT errors
    app.use((err, req, res, next) => {
        if (err.name === 'JsonWebTokenError' ||
            err.name === 'NotBeforeError' ||
            err.name === 'TokenExpiredError'
        ) {
            return res
                .status(401)
                .json({
                    errors: {
                        message: 'Invalid token'
                    }
                })
        }

        return next(err)
    })

    app.use((err, req, res, next) => {
        return res
            .status(err.status || 500)
            .json({
                errors: {
                    message: err.message
                }
            })
    })
}