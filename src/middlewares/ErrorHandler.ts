import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers'

@Middleware({ type: 'after' })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {
    error(error: any, request: any, response: any, next: (err: any) => any) {
        response.status(error.status || 500)
        response.json({
            errors: {
                message: error.message
            }
        })
    }
}
