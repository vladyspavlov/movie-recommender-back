import { prop, Ref, modelOptions, ReturnModelType } from '@typegoose/typegoose'
import { Person } from './Person'
import { Movie } from './Movie'
import { Types } from 'mongoose'

export class CreditCast {
    @prop({ index: true, trim: true })
    character?: string

    @prop()
    order?: number
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class Credit {
    @prop({ trim: true })
    creditType?: string

    @prop({ trim: true })
    department?: string

    @prop({ trim: true })
    job?: string

    @prop({ _id: false })
    cast?: CreditCast | null

    @prop({ ref: Movie, required: true, index: true })
    media!: Ref<Movie>

    @prop({ ref: Person, required: true, index: true })
    person!: Ref<Person>

    public static async findOrCreate(
        this: ReturnModelType<typeof Credit>,
        instance: Credit
    ) {
        //mongoLogger.debug(`Called findOrCreate(${instance}) of ${this.modelName}`)
        return await this.findOne(instance).exec() || await this.create(instance)
    }
    
    public static findByPerson(
        this: ReturnModelType<typeof Credit>,
        personId: Types.ObjectId
    ) {
        //mongoLogger.debug(`Called findByPerson(${personId}) of ${this.modelName}`)
        return this.find({ person: personId }).exec()
    }

    public static findByMovie(
        this: ReturnModelType<typeof Credit>,
        movieId: Types.ObjectId
    ) {
        //mongoLogger.debug(`Called findByMovie(${movieId}) of ${this.modelName}`)
        return this.find({ media: movieId }).exec()
    }
}
