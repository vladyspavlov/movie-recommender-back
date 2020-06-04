import { deleteUser } from '../controllers/user'
import { Router } from 'express'
import { celebrate, Joi } from 'celebrate'
import { authorized } from '../middlewares/authorized'

const route = Router()

export default function(router: Router) {
    router.use('/user', route)
    
    route.delete(
        '',
        authorized(false),
        deleteUser
    )
}