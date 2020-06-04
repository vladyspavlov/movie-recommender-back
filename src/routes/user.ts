import { deleteUser, getSeenMovies, addSeenMovie, deleteSeenMovie, updateSeenMovie } from '../controllers/user'
import { Router } from 'express'
import { celebrate, Joi } from 'celebrate'
import { authorized } from '../middlewares/authorized'
import { isValidObjectId } from 'mongoose'

const route = Router()

export default function(router: Router) {
    router.use('/user', route)
    
    route.delete(
        '',
        authorized(false),
        deleteUser
    )

    route.get(
        '/seen',
        authorized(),
        getSeenMovies
    )

    route.post(
        '/seen',
        authorized(),
        celebrate({
            body: Joi.object({
                media: Joi
                    .custom(
                        (value, helpers) => 
                        isValidObjectId(value) ? value : helpers.error('any.invalid')
                    )
                    .required(),
                score: Joi
                    .number()
                    .min(1)
                    .max(5)
                    .required()
            })
        }),
        addSeenMovie
    )

    route.delete(
        '/seen/:id',
        authorized(),
        celebrate({
            params: Joi.object({
                id: Joi
                    .custom(
                        (value, helpers) => 
                        isValidObjectId(value) ? value : helpers.error('any.invalid')
                    )
                    .required()
            })
        }),
        deleteSeenMovie
    )

    route.post(
        '/seen/:id',
        authorized(),
        celebrate({
            params: Joi.object({
                id: Joi
                    .custom(
                        (value, helpers) => 
                        isValidObjectId(value) ? value : helpers.error('any.invalid')
                    )
                    .required()
            }),
            body: Joi.object({
                score: Joi
                    .number()
                    .min(1)
                    .max(5)
                    .required()
            })
        }),
        updateSeenMovie
    )
}
