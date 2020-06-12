import { Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import { AuthService } from '../services/app/auth'

export function authorized() {
    const authServiceInstance = Container.get(AuthService)

    return async function(req: Request, res: Response, next: NextFunction) {
        const authorization = req.headers['authorization']
        const signature = req.cookies['signature']

        if (!authorization || !signature) {
            return res
                .status(403)
                .json({
                    errors: {
                        message: 'Invalid token'
                    }
                })
        }

        if (!authorization.startsWith('Bearer')) {
            return res
                .status(403)
                .json({
                    errors: {
                        message: 'Invalid header'
                    }
                })
        }

        const authorizationToken = authorization.split(' ')[1]
        const token = authorizationToken + '.' + signature

        try {
            const payload = await authServiceInstance.verifyJWT(token)
            res.locals['token'] = token
            res.locals['signature'] = signature
            res.locals['payload'] = payload
            return next()
        } catch (e) {
            return next(e)
        }
    }
}