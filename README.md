
# Deploy prod
docker-compose -f ./docker-compose-runtime.yml up -d

# Setup development:
- init `.env` of `core-functions` vs `hasura`. Look like `.env.example`
- `docker-compose  up -d`: Create db vs init hasura
- `cd core-functions` vs run `yarn start:dev` : start service on port 3000

# Hasura command:
- open console `hasura console`
- migrate db: `hasura migrate apply`
- migrate metadata: `hasura metadata apply`