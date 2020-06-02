import { prop, arrayProp, modelOptions, Ref, ReturnModelType } from '@typegoose/typegoose'
import { User } from './User'
import { Movie as TMDBMovie } from '../movie/Movie'

@modelOptions({ schemaOptions: { timestamps: true } })
export class Movie {
    @prop({ index: true, required: true, ref: User })
    user!: Ref<User>

    @prop({ index: true, required: true, ref: TMDBMovie })
    media!: Ref<TMDBMovie>

    @prop({ required: true })
    score!: number

    /* public static async findOrCreate(
        this: ReturnModelType<typeof User>,
        instance: User
    ) {
        return await this.findOne({
            email: instance.email,
            googleId: instance.googleId
        }).exec() || await this.create(instance)
    } */
}
