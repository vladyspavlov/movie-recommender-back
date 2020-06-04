import { Service } from 'typedi'
import { AxiosResponse } from 'axios'

import * as TMDB from '../../interfaces/TMDB'
import { TMDBService } from './service'

import { Person, PersonTranslationData, PersonTranslation } from '../../models/movie/Person'

type personResponse = AxiosResponse<TMDB.Response.Person.Details &
    { translations: Pick<TMDB.Response.Person.Translations, 'translations'> }>


@Service()
export default class PersonService extends TMDBService {
    constructor() {
        super()
    }

    public async get(id: Person['tmdbId'] | 'latest') {
        try {
            const person: personResponse = await this.axiosInstance.get(`/person/${id}`, {
                params: {
                    append_to_response: 'translations'
                }
            })
    
            return person.data
        } catch (e) {
            if (e.response) {
                const responseData: TMDB.Response.Error = e.response.data

                if (e.response.status === 404 && responseData.status_code === 34) {
                    return null
                }

                throw e
            } else {
                this.logger.error(`Can't load Person: ${id} `, e)
                throw e
            }
        }
    }
    
    public normalizeTranslations(
        translations: TMDB.Response.Person.Translations['translations']
    ) {
        return translations.map((translation) => {
            return {
                iso_639_1: translation.iso_639_1,
                iso_3166_1: translation.iso_3166_1,
                name: translation.name,
                data: {
                    bio: translation.data.biography
                } as PersonTranslationData
            } as PersonTranslation
        })
    }
    
    public normalize(
        person: TMDB.Response.Person.Details,
        translations: Pick<TMDB.Response.Person.Translations, 'translations'>
    ) {
        const nTranslations = this.normalizeTranslations(translations.translations)
    
        return {
            name: person.name,
            gender: person.gender,
            tmdbId: person.id,
            imdbId: person.imdb_id,
            knownAs: person.also_known_as,
            birthday: person.birthday,
            birthplace: person.place_of_birth,
            deathday: person.deathday,
            department: person.known_for_department,
            adult: person.adult,
            profilePath: person.profile_path,
            bio: person.biography,
            homepage: person.homepage,
            popularity: person.popularity,
            translations: nTranslations
        } as Person
    }
    
    public async getAndUpdatePerson(id: Person['tmdbId']) {
        try {
            this.logger.debug(`Finding Person ${id}`)
            const candidate = await this.PersonModel.findByTMDB(id).exec()
    
            if (!candidate) {
                this.logger.debug(`Person ${id} is not found in database`)
                return null
            }
    
            this.logger.debug('Person found')
    
            // movie credits returned without some properties
            // 'adult' property exists in every person response data
            // so we check for it to confirm that person have full info or not in database
            if (!candidate.adult) {
                this.logger.debug('Person is not full')
                const personResponse = await this.get(id)

                if (!personResponse) {
                    return null
                }

                const { translations, ...person } = personResponse
                const normalizedPerson = this.normalize(
                    person,
                    translations
                )
                this.logger.info('Person loaded')
    
                await this.PersonModel.findByIdAndUpdate(candidate._id, normalizedPerson).exec()
                this.logger.info('Person updated')
            }

            this.logger.debug('Person is full')
        } catch (e) {
            this.logger.error(`Can't get and update person ${id} `, e)
            throw e
        }
    }
    
    public async getNotFilled() {
        this.logger.debug('Getting not filled persons')
        const toUpdate: Pick<Person, 'tmdbId'>[] = await this.PersonModel.aggregate([
            { $match: { adult: { $nin: [ false, true ] } } },
            { $project: { _id: 0, tmdbId: 1 } }
        ]).exec()

        return toUpdate.map(person => person.tmdbId)
    }

    public async getChangeList(params?: TMDB.Request.Changes.Changes) {
        try {
            const changesResponse: AxiosResponse<TMDB.Response.Changes.Changes> =
                await this.axiosInstance.get('/person/changes', {
                    params: params ? params : null
                })            

            return changesResponse.data
        } catch (e) {
            this.logger.error(`Can't load Change List `, e)
            throw e
        }
    }

    public async batchUpdate(toUpdate: number[] = []) {
        let ids: number[] = []

        if (toUpdate.length > 0) {
            ids = toUpdate
        } else {
            let changes: TMDB.Response.Changes.Changes

            try {
                changes = await this.getChangeList()
            } catch (e) {
                this.logger.error(e)
                return
            }

            ids = changes.results.map(result => result.id)
        }
    
        let perIteration = 4
        let counter = 2350

        while (counter < ids.length) {
            this.logger.info(`Persons complete: ${counter + 1}/${ids.length}`)

            let promises: Promise<any>[] = []

            for (let i = counter; i < counter + perIteration; i++) {
                promises.push(
                    this.getAndUpdatePerson(ids[i])
                        .then(
                            res => ({ success: true, id: ids[i], response: res })
                        )
                        .catch(
                            e => ({ success: false, id: ids[i], error: e })
                        )
                )
            }

            type promiseResult = { success: boolean, id: number } &
                ({ response: any, error?: never } | { response?: never, error: any })
            type errorResult = Omit<promiseResult, 'response'>
    
            const results: promiseResult[] = await Promise.all(promises)
            const errors: errorResult[] = results.filter(result => result.error)
    
            if (errors) {
                try {
                    await Promise.all(errors.map(person => this.getAndUpdatePerson(person.id)))
                } catch (e) {
                    this.logger.error(e)
                    return
                }
            }

            // Check again
            if (counter + perIteration >= ids.length) {
                perIteration = (counter + perIteration) - (ids.length - 1)
            }

            counter += perIteration
            this.logger.debug('==============================')
        }
    }
    
}
