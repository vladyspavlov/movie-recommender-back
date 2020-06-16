import { prop, modelOptions, ReturnModelType } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { timestamps: true } })
export class Genre {
    @prop({ index: true, unique: true })
    tmdbId?: number

    @prop({ index: true, trim: true })
    name?: string

    public static async findOrCreate(
        this: ReturnModelType<typeof Genre>,
        // https://github.com/DefinitelyTyped/DefinitelyTyped/commit/88a54a939455efa0937b55ed507631415a574c44
        // Need to be fixed
        instance: Genre
    ) {
        //mongoLogger.debug(`Called findOrCreate(${instance}) of ${this.modelName}`)
        return await this.findOne({ tmdbId: instance.tmdbId }).exec() || await this.create(instance)
    }

    public static findByTMDB(
        this: ReturnModelType<typeof Genre>,
        tmdbId: Genre['tmdbId']
    ) {
        //mongoLogger.debug(`Called findByTMDB(${tmdbId}) of ${this.modelName}`)
        return this.findOne({ tmdbId })
    }
}
