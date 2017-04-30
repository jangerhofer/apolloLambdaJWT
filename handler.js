import graphqlImport from 'graphql'
import {graphqlLambda, graphiqlLambda} from 'graphql-server-lambda'
import jwt from 'jsonwebtoken'
import {makeExecutableSchema} from 'graphql-tools'

// JWT Functions
// Checks whether valid token `isAdmin` property is set to true.
const isAdmin = async token => {
	const decoded = await jwt.verify(token, process.env.JWT_SECRET)
	return decoded.isAdmin
}

// Return token body if token is valid; error if token is invalid (in which case error message should contain explanation of why invalid, e.g. "Token expired")
const parseToken = async token => {
	return jwt.verify(token, process.env.JWT_SECRET)
}

// GraphQL Schema
const typeDefs = `
input loginPayload {
	username : String!
	password : String!
}

type Query {
	sampleString : String
	getLoginToken(input : loginPayload) : String
	authedQuery : Boolean
	checkToken : Boolean
}

type Mutation {
	sampleString : String
}

schema {
	query : Query
	mutation : Mutation
}
`

// GraphQL Resolverss
const resolvers = {
	Query: {
		sampleString: () => 'Hi there, query!',
		getLoginToken: (_, {input}) => {
			if (input.username === 'administrator' && input.password === 'secretPassword') {
				return jwt.sign({
					username: 'administrator',
					isAdmin: true
				}, process.env.JWT_SECRET, {
					expiresIn: '30 days'
				})
			}
			throw new Error('Invalid credentials.')
		},
		authedQuery: (_, args, {token}) => {
			return isAdmin(token).then(res => {
				return res
			})
		},
		checkToken: (_, args, {token}) => {
			return parseToken(token).then(parsed => {
				console.log(parsed)
				return true // Return true arbitrarily to show that token is valid
			}).catch(err => {
				return new Error(err)
			})
		}
	},
	Mutation: {
		sampleString: () => 'Hi there, mutation!'
	}
}

// Combine schema and resolvers for use in GraphQL handler.
const schema = makeExecutableSchema({
	typeDefs,
	resolvers
})

export const graphql = async (event, context, callback) => {
	context.callbackWaitsForEmptyEventLoop = false

	// Set up CORS header such that Apollo client does not have to be served from same URL as the AWS API Gateway origin.
	const callbackFilter = function (error, output) {
		output.headers['Access-Control-Allow-Origin'] = '*'
		callback(error, output)
	}

	const handler = graphqlLambda({
		schema,
		context: {
			token: event.headers.Authorization
		},
		debug: true
	})

	return handler(event, context, callbackFilter)
}

// Set endpoint for GraphiQL.  Use AWS Lambda default API Gateway URL unless Serverless Offline plugin sets IS_OFFLINE environment variable.
let endpointURL = '/dev/graphql'
if (process.env.IS_OFFLINE) {
	endpointURL = '/graphql'
}

export const graphiql = async (event, context, callback) => {
	context.callbackWaitsForEmptyEventLoop = false
	return graphiqlLambda({endpointURL})(event, context, callback)
}
