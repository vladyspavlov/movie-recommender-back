export namespace Response {
    export namespace Genre {
        export interface Genre {
            id: number
            name: string
        }
        
        export interface Genres {
            genres: Genre[]
        }    
    }

    export namespace Movie {
        export interface BelongsToColleciton {
            id: number
            name: string
            poster_path: string
            backdrop_path: string
        }
        
        export interface ProductionCompany {
            name: string
            id: number
            logo_path: string
            origin_country: string
        }

        export interface ProductionCountry {
            name: string
            iso_3166_1: string
        }

        export interface SpokenLanguage {
            iso_639_1: string
            name: string
        }

        export interface Details {
            adult: boolean
            backdrop_path: string
            belongs_to_collection: BelongsToColleciton
            budget: number
            genres: Genre.Genre[]
            homepage: string
            id: number
            imdb_id: string
            original_language: string
            original_title: string
            overview: string
            popularity: number
            poster_path: string
            production_companies: ProductionCompany[]
            production_countries: ProductionCountry[]
            release_date: string
            revenue: number
            runtime: number
            spoken_languages: SpokenLanguage[]
            status: 'Rumored' | 'Planned' | 'In Production' | 'Post Production' | 'Released' | 'Canceled'
            tagline: string
            title: string
            video: boolean
            vote_average: number
            vote_count: number
        }

        export interface AlternativeTitle {
            iso_3166_1: string
            title: string
            type: string
        }

        export interface AlternativeTitles {
            id: number
            titles: AlternativeTitle[]
        }

        export interface CreditsCast {
            cast_id: number
            character: string
            credit_id: string
            gender: number | null
            id: number
            name: string
            order: number
            profile_path: string | null
        }

        export interface CreditsCrew {
            credit_id: string
            department: string
            gender: number | null
            id: number
            job: string
            name: string
            profile_path: string | null
        }

        export interface Credits {
            id: number
            cast: CreditsCast[]
            crew: CreditsCrew[]
        }

        export interface Keywords {
            id: number
            keywords: Keyword.Keyword[]
        }

        export interface TranslationData {
            title: string
            overview: string
            homepage: string
        }

        export interface Translation {
            iso_3166_1: string
            iso_639_1: string
            name: string
            english_name: string
            data: TranslationData
        }

        export interface Translations {
            id: number
            translations: Translation[]
        }
    }

    export namespace Person {
        export interface Details {
            birthday: string | null
            known_for_department: string
            deathday: null | string
            id: number
            name: string
            also_known_as: string[]
            gender: number
            biography: string
            popularity: number
            place_of_birth: string | null
            profile_path: string | null
            adult: boolean
            imdb_id: string
            homepage: null | string
        }

        export interface TranslationData {
            biography: string
        }

        export interface Translation {
            iso_639_1: string
            iso_3166_1: string
            name: string
            data: TranslationData
            english_name: string
        }

        export interface Translations {
            translations: Translation[]
            id: number
        }
    }

    export namespace Keyword {
        export interface Keyword {
            id: number
            name: string
        }
    }

    export namespace Company {
        export interface Details {
            description: string
            headquarters: string
            homepage: string
            id: number
            logo_path: string
            name: string
            origin_country: string
            parent_company: null | Pick<Details, 'name' | 'id' | 'logo_path'>
        }
    }

    export namespace Changes {
        export interface Result {
            id: number
            adult: boolean | null
        }

        export interface Changes {
            results: Result[]
            page: number
            total_pages: number
            total_results: number
        }
    }

    export interface Error {
        status_code: number
        status_message: string
        success: boolean
    }
}

export namespace Request {
    export namespace Changes {
        export interface Changes {
            start_date?: string
            end_date?: string
            page?: number
        }
    }
}