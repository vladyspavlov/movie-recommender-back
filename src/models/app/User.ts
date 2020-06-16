import { prop, arrayProp, modelOptions, ReturnModelType } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { timestamps: true } })
export class User {
    @prop({ index: true, unique: true, lowercase: true })
    email?: string

    @prop({ index: true, required: true })
    name!: string

    @prop({ index: true, unique: true })
    googleId?: string

    @prop({ index: true, unique: true })
    token?: string

    public static async findOrCreate(
        this: ReturnModelType<typeof User>,
        // https://github.com/DefinitelyTyped/DefinitelyTyped/commit/88a54a939455efa0937b55ed507631415a574c44
        // Need to be fixed
        instance: User
    ) {
        return await this.findOne({
            email: instance.email,
            googleId: instance.googleId
        }).exec() || await this.create(instance)
    }
}
