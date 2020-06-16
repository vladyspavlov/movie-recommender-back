import { prop, modelOptions, ReturnModelType } from '@typegoose/typegoose'

export class PersonTranslationData {
    @prop({ trim: true })
    bio?: string
}

export class PersonTranslation {
    @prop({ trim: true })
    iso_639_1?: string

    @prop({ trim: true })
    iso_3166_1?: string

    @prop({ trim: true })
    name?: string

    @prop({ _id: false })
    data?: PersonTranslationData
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class Person {
    @prop({ index: true, trim: true })
    name?: string

    @prop({ default: 0, min: 0, max: 5 })
    gender?: number

    @prop({ index: true, unique: true })
    tmdbId?: number

    @prop({ index: true, /* validate: {
        validator: (value) => {
            if (value.toString() === '') return true
            return value.match(/^nm[0-9]{7}/)
        },
        message: 'Invalid imdbId'
    }, */ minlength: 0, maxlength: 9, trim: true })
    imdbId?: string | null

    @prop({ items: String, index: true, trim: true })
    knownAs?: string[]

    @prop({ trim: true })
    birthday?: string | null

    @prop({ trim: true })
    birthplace?: string | null

    @prop({ trim: true })
    deathday?: string | null

    @prop({ trim: true })
    department?: string

    @prop()
    adult?: boolean

    @prop({ trim: true })
    profilePath?: string | null

    @prop({ trim: true })
    bio?: string

    @prop({ trim: true })
    homepage?: string | null

    @prop()
    popularity?: number

    @prop({ items: PersonTranslation, _id: false })
    translations?: PersonTranslation[]

    public static async findOrCreate(
        this: ReturnModelType<typeof Person>,
        // https://github.com/DefinitelyTyped/DefinitelyTyped/commit/88a54a939455efa0937b55ed507631415a574c44
        // Need to be fixed
        instance: Person
    ) {
        //mongoLogger.debug(`Called findOrCreate(${instance}) of ${this.modelName}`)
        return await this.findOne({ tmdbId: instance.tmdbId }).exec() || await this.create(instance)
    }

    public static findByTMDB(
        this: ReturnModelType<typeof Person>,
        tmdbId: Person['tmdbId']
    ) {
        //mongoLogger.debug(`Called findByTMDB(${tmdbId}) of ${this.modelName}`)
        return this.findOne({ tmdbId })
    }

    public static findByIMDB(
        this: ReturnModelType<typeof Person>,
        imdbId: Person['imdbId']
    ) {
        //mongoLogger.debug(`Called findByIMDB(${imdbId}) of ${this.modelName}`)
        return this.findOne({ imdbId })
    }
}
