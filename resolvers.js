import { GraphQLError } from 'graphql'
import { getCompany } from './db/companies.js'
import { getJob, getJobs, getJobsByComapny, createJob, deleteJob, updateJob, countJobs } from './db/jobs.js'

// export const resolvers = {
//   Query: {
//     greeting: () => 'Hello Katty'
//   },
// }

export const resolvers = {
  Query: {
    jobs: async (_root, { limit, offset }) => {
      const items = getJobs(limit, offset)
      const totalCount = await countJobs()
      return { items, totalCount }
    },
    
    job: async (_root, { id }) => {
      const job = await getJob(id)
      if (!job) {
        throw notFoundError(`Not Found with id ${id}`)
      }
      return job
    },
    company: async (_root, { id }) => {
      const company = await getCompany(id)
      if (!company) {
        throw notFoundError(`Not Found with id ${id}`)
      }
      return company
    }
  },

  Mutation: {
    createJob: (_root, { input: { title, description } }, { user }) => {
      if (!user) {
        throw unauthorizedError('Missing authentication')
      }
      return createJob({ companyId: user.companyId, title, description })
    },
    
    // deleteJob: (_root, { id }) => deleteJob(id),
    deleteJob: async(_root, { id }, { user }) => {
      if (!user) {
        throw unauthorizedError('Missing authentication')
      }
      const job = await deleteJob(id, user.companyId)
      if (!job) {
        throw notFoundError(`Not Found with id ${id}`)
      }
      return job
    },



    updateJob: async (_root, { input: { id, title, description }}, { user }) => {
      if (!user) {
        throw unauthorizedError('Missing authentication')
      }
      const job = await updateJob({ id, title, description, companyId: user.companyId })
      if (!job) {
        throw notFoundError(`Not Found with id ${id}`)
      }
      return job
    },
  },

  Company: {
    jobs: (company) => getJobsByComapny(company.id)
  },

  Job: {
    //company: (job) => companyLoader.load(job.companyId),
    company: (job, _args, { companyLoader }) => {
      return companyLoader.load(job.companyId)
    },
    date: (job) => toIsoDate(job.createdAt),
  },
}

// helper function
function toIsoDate(value) {
  return value.slice(0, 'yyyy-mm-dd'.length)
}

function notFoundError(message) {
  return new GraphQLError(message, {
    extensions: { code: 'NOT_FOUND' },
  })
}

function unauthorizedError(message) {
  return new GraphQLError(message, {
    extensions: { code: 'UNAUTHORIZED' }
  })
}
