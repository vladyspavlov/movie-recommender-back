import { OAuth2Client, VerifyIdTokenOptions, TokenPayload } from 'google-auth-library'
import config from '../../config'
import { User } from '../../models/app/User'
import { Service, Inject } from 'typedi'
import { ReturnModelType } from '@typegoose/typegoose'
import * as winston from 'winston'
import { EventDispatcher, EventDispatcherInterface } from '../../decorators/eventDispatcher'
import * as jwt from 'jsonwebtoken'
import events from '../../subscribers/events'
import { UserPayload } from '../../interfaces/User'

@Service()
export class AuthService {
    private googleAuthClient: OAuth2Client

    constructor(
        @Inject('AppDB UserModel')
        private UserModel: ReturnModelType<typeof User>,
        @Inject('AppLogger')
        private logger: winston.Logger,
        @EventDispatcher()
        private eventDispatcher: EventDispatcherInterface,
    ) {
        this.googleAuthClient = this.getGoogleAuthClient()
    }

    private getGoogleAuthClient() {
        return new OAuth2Client(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri
        )
    }

    public signJWT(payload: UserPayload): Promise<string> {
        return new Promise((res, rej) => {
            jwt.sign(
                payload,
                config.jwtSecret,
                {
                    algorithm: 'HS256',
                    expiresIn: '30 days'
                },
                (err, encoded) => {
                    if (err) {
                        rej(err)
                    }

                    res(encoded)
                }
            )
        })
    }

    public verifyJWT(token: string): Promise<UserPayload> {
        return new Promise((res, rej) => {
            jwt.verify(token, config.jwtSecret, (err, decoded) => {
                if (err) {
                    rej(err)
                }

                res(decoded as UserPayload)
            })
        })
    }

    public decodeJWT(token: string) {
        return jwt.decode(token) as UserPayload
    }

    public generateGoogleOAuthUrl() {
        return this.googleAuthClient.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
                'openid'
            ]
        })
    }

    public async verifyGoogleOAuth(idToken: VerifyIdTokenOptions['idToken']) {
        try {
            return this.googleAuthClient.verifyIdToken({
                idToken,
                audience: config.google.clientId
            })
        } catch (e) {
            this.logger.error(e)
            throw e
        }
    }

    public async signInGoogle(payload: TokenPayload) {
        try {
            const userDocument = await this.UserModel.findOrCreate({
                email: payload.email,
                name: payload.name,
                googleId: payload.sub
            })
            const token = await this.signJWT({
                id: userDocument._id,
                name: userDocument.name
            })
            userDocument.token = token
            await userDocument.save()
            const tokenParts = token.split('.')

            // Not working, check later
            //this.eventDispatcher.dispatch(events.user.signIn, { user: userDocument })

            return {
                tokenHeadersPayload: `${tokenParts[0]}.${tokenParts[1]}`,
                tokenSignature: tokenParts[2]
            }
        } catch (e) {
            this.logger.error(e)
            throw e
        }
    }

    public async renewToken(token: string) {
        try {
            const payload = await this.verifyJWT(token)
            const userDocument = await this.UserModel.findById(payload.id)
            const newToken = await this.signJWT({
                id: userDocument._id,
                name: userDocument.name
            })
            userDocument.token = newToken
            await userDocument.save()
            
            return newToken
        } catch (e) {
            this.logger.error(e)
            throw e
        }
    }

    public async logout(token: string) {
        try {
            const payload = jwt.decode(token) as UserPayload
            const userDocument = await this.UserModel.findById(payload.id)
            userDocument.token = ''
            await userDocument.save()
        } catch (e) {
            this.logger.error(e)
            throw e
        }
    }
}