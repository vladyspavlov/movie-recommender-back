import { Types } from 'mongoose'

export interface UserPayload {
    id: Types.ObjectId,
    name: string
}