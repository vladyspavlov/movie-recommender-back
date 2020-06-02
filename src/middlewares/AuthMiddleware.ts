import { ExpressMiddlewareInterface } from 'routing-controllers'

export class AuthMiddleware implements ExpressMiddlewareInterface {
    use(request: any, response: any, next?: (err?: any) => any): any {
        // check request for token, if token sended - deny auth try
        console.log(request)
        next()
    }
}