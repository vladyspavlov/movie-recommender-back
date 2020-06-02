import { prop, modelOptions, Ref, ReturnModelType } from '@typegoose/typegoose'
import { Types } from 'mongoose'

@modelOptions({ schemaOptions: { timestamps: true } })
export class Company {
    @prop({ index: true, unique: true })
    tmdbId?: number

    @prop({ trim: true })
    description?: string

    @prop({ trim: true })
    headquarters?: string

    @prop({ trim: true })
    homepage?: string

    @prop({ trim: true })
    logoPath?: string | null

    @prop({ index: true, trim: true })
    name?: string

    @prop({ trim: true, minlength: 0, maxlength: 2 })
    originCountry?: string | null

    @prop({ ref: Company })
    parentCompany?: Ref<Company> | null

    public static async findOrCreate(
        this: ReturnModelType<typeof Company>,
        instance: Company
    ) {
        //mongoLogger.debug(`Called findOrCreate(${instance}) of ${this.modelName}`)
        return await this.findOne({ tmdbId: instance.tmdbId }).exec() || await this.create(instance)
    }

    public static findLatest(
        this: ReturnModelType<typeof Company>
    ) {
        //mongoLogger.debug(`Called findLatest() of ${this.modelName}`)
        return this.findOne().sort({ _id: -1 }).exec()
    }

    public static findLatestTMDB(
        this: ReturnModelType<typeof Company>
    ) {
        //mongoLogger.debug(`Called findLatestTMDB() of ${this.modelName}`)
        return this.findOne().sort({ tmdbId: -1 }).exec()
    }

    public static setParent(
        this: ReturnModelType<typeof Company>,
        id: Types.ObjectId,
        parent: Company['parentCompany']
    ) {
        //mongoLogger.debug(`Called setParent(${id}, ${parent}) of ${this.modelName}`)
        return this.findByIdAndUpdate(id, {
            $set: {
                'parentCompany': parent
            }
        }).exec()
    }
}
