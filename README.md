# Source Function Template

> Base template to deploy your next source function

1. Click `Use This Template` above

- (If Segment PS, add to `Segment Services Engineering` Organization

## Setup Steps

1. `nvm use` (to get the right version of NodeJS)
   - As of 2023/02/22, Segment Functions require NodeJS 14.19.3
   - [If needed, install `nvm`](https://github.com/nvm-sh/nvm#install--update-script)
2. `npm install` (to install npm dependencies)

## To Test

`npm run test`

- GitHub Actions workflow also runs tests before deploying
- Tests are created in `src/index.test.js`

## To Deploy via GitHub Actions

1. Create GitHub Environments in `Settings` → `Environments` → `DEV`

   - _`DEV` is enabled by default in the `.github/workflows/deployFunction.yml` file_
   - (repeat for `QA` & `PROD`)

2. Create Source Function in Segment Workspace
3. Connect Source Function to a Segment Source
4. Create Public API Token to allow for deploying
5. Add the following Environment Secrets
   - `FUNCTION_ID` (include the `sfnc_` part of the function id)
     - Get it from the URL of the Function
     - ![2023-09-11_17-13-03](https://github.com/segment-services-eng/source-function-template/assets/7215306/631c7bb9-95f3-47ab-9072-6343478be4c2)
   - `SOURCE_ID` (available in the Source Settings → API Keys tab)
     - ![2023-09-11_17-14-05](https://github.com/segment-services-eng/source-function-template/assets/7215306/043e6ab3-a454-4232-b06c-72f689411d31)
   - `PUBLIC_API_TOKEN` ([Get an API Token](https://segment.com/docs/api/public-api/#config-api-vs-public-api))
     ![DEV Environment Secrets](https://github.com/segment-services-eng/source-function-template/assets/7215306/2e4b1207-7dca-4683-9c58-8cf4906824bf)

## Deploying to multiple environments

1. Once changes look good in the DEV environment, uncomment the QA section from
   the `deployFunction.yml` file.
2. Push changes to your branch
3. Add the label `!!_RELEASE_TO_QA` to the PR to deploy it to QA
   - (ensure a `QA` GitHub Environment has been created)
4. If ready to deploy to PROD, uncomment the PROD section from the `deployFunction.yml.yml`
   file & merge the PR (ensure a `PROD` GitHub Environment has been created)

## Tooling Included

1. [Jest for code testing](https://jestjs.io/docs/expect)
2. [Prettier for code formatting](https://prettier.io/)
3. [ESLint for code linting](https://eslint.org/)
4. [GitHub Actions script for function deploy](https://docs.github.com/en/actions)
5. [Husky for commit validation](https://github.com/typicode/husky)
