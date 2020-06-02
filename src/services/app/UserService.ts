/* import { OAuth2Client, GetTokenOptions, TokenPayload } from 'google-auth-library'
import config from '../../config'
import { User } from '../../models/app/User'
import { Service, Inject } from 'typedi'
import { ReturnModelType } from '@typegoose/typegoose'
import * as winston from 'winston'
import { EventDispatcher, EventDispatcherInterface } from '../../decorators/eventDispatcher'
import * as jwt from 'jsonwebtoken'
import events from '../../subscribers/events'

@Service()
export class AuthService {
    private googleAuthClient: OAuth2Client

    constructor(
        @Inject('AppDB UserModel')
        private userModel: ReturnModelType<typeof User>,
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

    public async verifyGoogleOAuth(authCode: GetTokenOptions['code']) {
        try {
            const tokens = await this.googleAuthClient.getToken(authCode)
            return this.googleAuthClient.verifyIdToken({
                idToken: tokens.tokens.id_token,
                audience: config.google.clientId
            })
        } catch (e) {
            this.logger.error(e)
            throw e
        }
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

    public signJWT(payload: object): Promise<string> {
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

    public verifyJWT(token: string): Promise<object> {
        return new Promise((res, rej) => {
            jwt.verify(token, config.jwtSecret, (err, decoded) => {
                if (err) {
                    rej(err)
                }

                res(decoded)
            })
        })
    }

    public async signIn(payload: TokenPayload) {
        if (payload.aud !== config.google.clientId ||
            new Date(payload.exp * 1000) <= new Date()
        ) {
            throw new Error('Invalid token')
        }

        try {
            const userDocument = await this.userModel.findOrCreate({
                email: payload.email,
                name: payload.name,
                googleId: payload.sub
            })
            const token = await this.signJWT({
                id: userDocument._id,
                name: userDocument.name
            })
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
} */