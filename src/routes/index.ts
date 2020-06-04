import { Router } from 'express'
import auth from './auth'
import user from './user'
import movies from './movies'
import persons from './persons'

export default function () {
    const router = Router()

    auth(router)
    user(router)
    movies(router)
    persons(router)

    return router
}