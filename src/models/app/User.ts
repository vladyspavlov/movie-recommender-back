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
        instance: User
    ) {
        return await this.findOne({
            email: instance.email,
            googleId: instance.googleId
        }).exec() || await this.create(instance)
    }
}
