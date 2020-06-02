import { JsonController, Authorized, Redirect, QueryParam, Body, Get, Res } from 'routing-controllers'
import { Container } from 'typedi'
import * as winston from 'winston'
import { AuthService } from '../services/app/AuthService'
import { Response } from 'express'

@JsonController('/auth')
export class AuthController {
    @Authorized('GUEST')
    @Get('/google')
    signInGoogle() {
        const AuthServiceInstance = Container.get(AuthService)
        return {
            url: AuthServiceInstance.generateGoogleOAuthUrl()
        }
    }

    @Authorized('GUEST')
    @Get('/googleVerify')
    async verifyGoogle(
        @QueryParam('code', { required: true })
        code: string,
        @Res()
        response: Response
    ) {
        // Get request from frontend (not redirect from google oauth such as now)
        const logger: winston.Logger = Container.get('AppLogger')
        const AuthServiceInstance = Container.get(AuthService)

        try {
            const loginTicket = await AuthServiceInstance.verifyGoogleOAuth(code)
            const {
                tokenHeadersPayload,
                tokenSignature
            } = await AuthServiceInstance.signIn(loginTicket.getPayload())

            response.cookie('signature', tokenSignature, {
                maxAge: 1000 * 60 * 60 * 24 * 30,
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
            })

            return {
                token: tokenHeadersPayload
            }
        } catch (e) {
            logger.error('🔥 error ', e)
        }
    }
    
}