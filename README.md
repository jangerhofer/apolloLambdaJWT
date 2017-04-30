# JWT Serverless Apollo Test

Example of how to use [JSON Web Tokens](https://jwt.io/introduction/) as an  authentication mechanism in an [Apollo](http://www.apollodata.com/) GraphQL app.


## Setting JWT Token Secret
Serverless will pull environment variables from a file called `env.yml` based on the ["stage"](https://serverless.com/framework/docs/providers/openwhisk/guide/services#referencing-cli-options) you specify at deploy-time (defaults to `dev`).  This file has been added to `.gitignore` such that the file isn't accidentally committed.  In its most barebones form, `env.yml` looks like this:

```
dev:
  JWT_SECRET: Some...secret...here

```

*N.B.  You will need to adjust the `endpointURL` variable in the `handler.js` file if you deploy to a stage not named `dev`.*
