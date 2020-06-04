import { signInGoogle, verifyGoogle, logout } from '../controllers/auth'
import { Router } from 'express'
import { celebrate, Joi } from 'celebrate'
import { authorized } from '../middlewares/authorized'

const route = Router()

export default function(router: Router) {
    router.use('/auth', route)
    
    route.get(
        '/google',
        signInGoogle
    )

    route.post(
        '/verifyGoogle',
        celebrate({
            body: Joi.object({
                code: Joi.string().required()
            })
        }),
        verifyGoogle
    )

    route.get(
        '/logout',
        authorized(false),
        logout
    )
}