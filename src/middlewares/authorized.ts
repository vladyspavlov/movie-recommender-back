import { Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import { AuthService } from '../services/app/auth'

export function authorized(generateToken = true) {
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
            
            if (!generateToken) {
                const payload = await authServiceInstance.verifyJWT(token)
                res.locals['token'] = token
                res.locals['signature'] = signature
                res.locals['payload'] = payload
                return next()
            }

            const newToken = await authServiceInstance.renewToken(token)
            const newTokenParts = newToken.split('.')
            const newHeadersPayload = newTokenParts[0] + '.' + newTokenParts[1]
            const newSignature = newTokenParts[2]
            res.locals['token'] = newHeadersPayload
            res.locals['signature'] = newSignature
            return next()
        } catch (e) {
            return next(e)
        }
    }
}