import config from '../config'
import getMovies from '../jobs/getMovies'
import * as Agenda from 'agenda'

export default ({ agenda }: { agenda: Agenda }) => {
    agenda.define(
        'get-movies',
        { priority: 'high', concurrency: config.agenda.concurrency },
        getMovies
    )

    /**
     * @todo jobs for movie changes
     * @todo jobs for person changes
     * @todo jobs for person loading
     */

    agenda.start()
    //agenda.every('day', 'get-movies')
}