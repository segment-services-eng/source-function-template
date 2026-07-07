![Segment_Functions](https://github.com/segment-services-eng/source-function-template/assets/7215306/869b8090-9c1d-457e-b52b-4c6b81ff34c4)

# Source Function Template

> Base template to deploy your next **source** function.

1. Click `Use This Template` above.
   - (If Segment PS, add to the `Segment Services Engineering` Organization.)

## Setup Steps

1. `nvm use` (to get the right version of NodeJS)
   - [If needed, install `nvm`](https://github.com/nvm-sh/nvm#install--update-script)
2. `npm install` (to install npm dependencies)

## To Test

`npm run test`

- The Buildkite pipeline also runs tests before every deploy.
- Tests live in `src/index.test.js`; the function code lives in `src/index.js`.

---

## Key concept: a source function has THREE ids

Deploying a source function is a **two-call** operation against the Segment
Public API, and it touches **three different ids**. Getting these straight is
the single most important thing in this repo — mixing them up produces
confusing `400 / "provide a valid Source function instance ID"` errors.

| Id | Prefix / shape | What it is | Where you find it |
| --- | --- | --- | --- |
| **Function id** | `sfnc_...` | The source-function *definition* (the code). | Segment UI URL of the function, or `GET /functions`. |
| **Source id** | 22-char, e.g. `aj3EN6RALrMxFZe7q3Cjd8` | The *connected source* that wraps the function. | Source → **Settings → API Keys** tab ("Source ID"). |
| **Source function instance id** | `sfn_` + the Source id | The deploy target. | **Derived**: take the Source id and prefix it with `sfn_`. |

> ⚠️ **The gotcha:** the deploy endpoint (`POST /functions/{id}/deploy`) does
> **not** accept the `sfnc_` function id, and it does **not** accept the raw
> Source id either. It requires the **`sfn_`-prefixed** "source function
> instance" id — i.e. the Source id from the API Keys tab **with `sfn_`
> prepended**. Example: Source id `aj3EN6RALrMxFZe7q3Cjd8` →
> deploy id `sfn_aj3EN6RALrMxFZe7q3Cjd8`.

### How the deploy uses them

`scripts/deployFunction.js` does two API calls per run:

1. **Push code** — `PATCH https://api.segmentapis.com/functions/{FUNCTION_ID}`
   with the contents of `src/index.js`. Uses the **`sfnc_`** id.
2. **Deploy to the connected source** —
   `POST https://api.segmentapis.com/functions/{SOURCE_ID}/deploy`. Uses the
   **`sfn_`** id (Source id prefixed with `sfn_`).

So the two env vars are:

- `FUNCTION_ID` = the `sfnc_...` function id.
- `SOURCE_ID` = `sfn_` + the Source id (NOT the raw Source id, NOT the `sfnc_` id).

(A destination function, by contrast, only PATCHes the function — it has no
second "deploy to source" call. That's the core source-vs-destination
difference.)

---

## One function + one source PER environment

Each environment (DEV / QA / PROD) needs its **own** function **and** its own
connected source. To create a new environment's pair via the Public API:

1. `POST /functions` with `{ "displayName": "<ENV> - Source Function Template",
   "resourceType": "SOURCE", "code": "<contents of src/index.js>" }`.
   The response includes the `sfnc_...` id and a `catalogId` (which is just the
   id minus the `sfnc_` prefix).
2. `POST /sources` with `{ "slug": "<env>-source-function-template",
   "enabled": true, "metadataId": "<catalogId from step 1>" }`. The response
   includes the 22-char Source id.
3. The deploy id for that env is then `sfn_<Source id>`.

> Tip: the Segment Public API returns the function `code` field with literal
> unescaped newlines, so piping the create response through `jq` fails. Extract
> ids with `grep -oE '"id":"sfnc_[A-Za-z0-9]+"'` instead — the resource is still
> created successfully.

All three environments live in the **same Segment workspace**; naming them
`DEV - ` / `QA - ` / `PROD - Source Function Template` keeps them
distinguishable.

---

## To Deploy via GitHub Actions

This is the **out-of-the-box** deploy path — if you used this template, this is
what works with no extra infrastructure. The workflow is defined in
[`.github/workflows/deployFunction.yml`](.github/workflows/deployFunction.yml);
it installs dependencies, runs tests, then deploys via `scripts/deployFunction.js`.

1. Create GitHub Environments in `Settings` → `Environments` → `DEV`
   (repeat for `QA` & `PROD`). `DEV` is enabled by default in the workflow;
   uncomment the `QA`/`PROD` jobs when you're ready to promote to them.
2. Create the function + connected source **per environment** in your Segment
   workspace (see "One function + one source per environment" above).
3. Create a Public API Token to allow deploying.
4. Add these **Environment Secrets** to each environment:
   - `FUNCTION_ID` — the `sfnc_...` function id.
   - `SOURCE_ID` — the **`sfn_`-prefixed** source function instance id (the
     Source id from Settings → API Keys, with `sfn_` prepended).
   - `PUBLIC_API_TOKEN` — [get an API token](https://segment.com/docs/api/public-api/#config-api-vs-public-api).

To promote: add the `!!_RELEASE_TO_QA` label to the PR to deploy to QA; merge to
`main` to deploy to PROD.

## Internal Twilio: Deploy via Buildkite

Inside Twilio we deploy through Buildkite instead of GitHub-hosted runners. The
pipeline is defined in [`.buildkite/pipeline.yml`](.buildkite/pipeline.yml);
each environment step installs dependencies, runs tests, then deploys via the
same `scripts/deployFunction.js`.

1. Create a Buildkite pipeline pointed at this repo (GitHub webhook + a queue
   with connected agents). On the `twilio-primary-default` cluster, use a live
   general-purpose queue such as `general-001` — the `default` queue is paused
   and has no agents, so jobs sent there hang in "queuing".
2. Store the deploy secrets in **AWS Secrets Manager** (region `us-west-2`,
   account `058449100246` / success-write) and let the pipeline read them at
   deploy time by assuming an IAM role via the Buildkite OIDC provider — no
   static keys, no Buildkite-stored secrets:
   - `segment/source-function-template/public-api-token` →
     `{ "PUBLIC_API_TOKEN": "..." }` (shared across all envs).
   - `segment/source-function-template/<dev|qa|prod>/function-id` →
     `{ "FUNCTION_ID": "sfnc_...", "SOURCE_ID": "sfn_..." }` (per env; holds
     BOTH ids the two-call deploy needs).
   - IAM role `twilio-internal_source-function-template` is assumed by the
     `aws-assume-role-with-web-identity` plugin; its trust policy is scoped to
     this pipeline's slug and it may only read these secrets. (Created manually
     in success-write, mirroring `destination-function-template` — not in
     Terraform.)
   - The deploy step sources [`.buildkite/fetch-secrets.sh`](.buildkite/fetch-secrets.sh)
     to load `PUBLIC_API_TOKEN`, `FUNCTION_ID`, and `SOURCE_ID` for the target
     `DEPLOY_ENV`.
3. Promote the same way: `!!_RELEASE_TO_QA` label → QA step; merge to `main` →
   PROD step. Per-step commit statuses (`buildkite/<slug>/dev`, `/qa`, `/prod`)
   gate the PR merge.

## Tooling Included

1. [Jest for code testing](https://jestjs.io/docs/expect) (Istanbul/`babel`
   coverage provider for honest branch coverage)
2. [Prettier for code formatting](https://prettier.io/)
3. [ESLint (flat config) for code linting](https://eslint.org/)
4. [Buildkite pipeline for function deploy](https://buildkite.com/docs/pipelines)
5. [Husky for commit validation](https://github.com/typicode/husky)
