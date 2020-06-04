import { User } from '../../models/app/User'
import { Seen } from '../../models/app/Seen'
import { Service, Inject } from 'typedi'
import { ReturnModelType } from '@typegoose/typegoose'
import * as winston from 'winston'
import { EventDispatcher, EventDispatcherInterface } from '../../decorators/eventDispatcher'
import events from '../../subscribers/events'
import { Types } from 'mongoose'
import { omit } from 'lodash'

@Service()
export class UserService {
    constructor(
        @Inject('AppDB UserModel')
        private UserModel: ReturnModelType<typeof User>,
        @Inject('AppDB SeenModel')
        private SeenModel: ReturnModelType<typeof Seen>,
        @Inject('AppLogger')
        private logger: winston.Logger,
        @EventDispatcher()
        private eventDispatcher: EventDispatcherInterface,
    ) {}

    public async deleteUser(id: Types.ObjectId) {
        try {
            const userDocument = await this.UserModel
                .findByIdAndDelete(id)
                .exec()
            await this.SeenModel
                .deleteMany({
                    user: userDocument._id
                })
                .exec()
        } catch (e) {
            throw e
        }
    }

    public async getSeenMovies(userId: Types.ObjectId) {
        try {
            return await this.SeenModel
                .find({
                    user: userId
                })
                .select({
                    user: 0,
                    __v: 0,
                    createdAt: 0,
                    updatedAt: 0
                })
                .exec()
        } catch (e) {
            throw e
        }
    }

    public async addSeenMovie(
        userId: Types.ObjectId,
        mediaId: Types.ObjectId,
        score: number
    ) {
        if (isNaN(score)) {
            throw new Error('Bad score')
        }

        const fieldsToOmit = ['__v', 'createdAt', 'updatedAt', 'user']

        try {
            const seen = await this.SeenModel.create({
                user: userId,
                media: mediaId,
                score
            })

            return omit(seen.toJSON(), fieldsToOmit)
        } catch (e) {
            if (e.code === 11000) {
                const err = new Error('User already seen this movie')
                err['status'] = 409
                throw err
            }

            throw e
        }
    }

    public async deleteSeenMovie(seenId: Types.ObjectId) {
        try {
            await this.SeenModel
                .findByIdAndDelete(seenId)
                .exec()
        } catch (e) {
            throw e
        }
    }

    public async updateSeenMovie(seenId: Types.ObjectId, score: number) {
        if (isNaN(score)) {
            throw new Error('Bad score')
        }

        try {
            return await this.SeenModel
                .findByIdAndUpdate(seenId, {
                    $set: {
                        score
                    }
                }, {
                    new: true
                })
                .select({
                    __v: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    user: 0
                })
                .exec()
        } catch (e) {
            throw e
        }
    }
}