import { Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import * as winston from 'winston'
import { AuthService } from '../services/app/auth'

export function signInGoogle(req: Request, res: Response) {
    const authServiceInstance = Container.get(AuthService)

    return res
        .status(200)
        .json({
            url: authServiceInstance.generateGoogleOAuthUrl()
        })
}

export async function verifyGoogle(req: Request, res: Response, next: NextFunction) {
    const logger: winston.Logger = Container.get('AppLogger')
    const authServiceInstance = Container.get(AuthService)
    const code = decodeURIComponent(req.body.code as string)

    try {
        const loginTicket = await authServiceInstance.verifyGoogleOAuth(code)
        const {
            tokenHeadersPayload,
            tokenSignature
        } = await authServiceInstance.signInGoogle(loginTicket.getPayload())

        res.cookie('signature', tokenSignature, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
        })

        return res
            .status(200)
            .json({
                token: tokenHeadersPayload
            })
    } catch (e) {
        logger.error('🔥 error ', e)
        return next(e)
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    const logger: winston.Logger = Container.get('AppLogger')
    const authServiceInstance = Container.get(AuthService)

    try {
        await authServiceInstance.logout(res.locals['token'])
        return res
            .clearCookie('signature')
            .sendStatus(200)
    } catch (e) {
        logger.error('🔥 error ', e)
        return next(e)
    }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
    const logger: winston.Logger = Container.get('AppLogger')
    const authServiceInstance = Container.get(AuthService)

    try {
        const newToken = await authServiceInstance.renewToken(res.locals['token'])
        const newTokenParts = newToken.split('.')
        const newHeadersPayload = newTokenParts[0] + '.' + newTokenParts[1]
        const newSignature = newTokenParts[2]
        res.locals['token'] = newHeadersPayload
        res.locals['signature'] = newSignature
        res.locals['payload'] = authServiceInstance.decodeJWT(newToken)

        res.cookie('signature', newSignature, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
        })

        return res
            .status(200)
            .json({
                token: newHeadersPayload
            })
    } catch (e) {
        logger.error('🔥 error ', e)
        return next(e)
    }
}