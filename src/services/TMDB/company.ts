import { Service } from 'typedi'

import * as TMDB from '../../interfaces/TMDB'
import { TMDBService } from './service'

import { Company } from '../../models/movie/Company'

@Service()
export default class CompanyService extends TMDBService {
    constructor() {
        super()
    }
    
    async normalize(company: TMDB.Response.Company.Details) {
        let parentCompanyId: Company['parentCompany']
    
        if (company.parent_company) {
            const parentCompany = await this.CompanyModel.findOne({ tmdbId: company.parent_company.id })
    
            if (parentCompany) {
                parentCompanyId = parentCompany._id
            }
        }
    
        return {
            description: company.description,
            headquarters: company.headquarters,
            homepage: company.homepage,
            tmdbId: company.id,
            logoPath: company.logo_path,
            name: company.name,
            originCountry: company.origin_country,
            parentCompany: parentCompanyId
        } as Company
    }
}
