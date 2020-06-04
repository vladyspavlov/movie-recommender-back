import { getOne, getPopular } from '../controllers/persons'
import { Router } from 'express'
import { celebrate, Joi } from 'celebrate'
import { authorized } from '../middlewares/authorized'

const route = Router()

export default function(router: Router) {
    router.use('/persons', route)
    
    route.get(
        '/person/:id',
        authorized(),
        celebrate({
            params: Joi.object({
                id: Joi.string().required()
            })
        }),
        getOne
    )

    route.get(
        '/popular',
        authorized(),
        celebrate({
            query: Joi.object({
                count: Joi.number().min(1).max(250).default(null)
            })
        }),
        getPopular
    )
}