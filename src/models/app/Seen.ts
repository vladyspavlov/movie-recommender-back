import { prop, modelOptions, Ref, index } from '@typegoose/typegoose'
import { User } from './User'
import { Movie as TMDBMovie } from '../movie/Movie'

@modelOptions({ schemaOptions: { timestamps: true } })
@index({ user: 1, media: 1 }, { unique: true })
export class Seen {
    @prop({ index: true, required: true, ref: User })
    user!: Ref<User>

    @prop({ index: true, required: true, ref: TMDBMovie })
    media!: Ref<TMDBMovie>

    @prop({ required: true })
    score!: number
}
