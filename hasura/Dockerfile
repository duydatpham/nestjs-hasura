FROM hasura/graphql-engine:v2.34.0

WORKDIR /app
COPY metadata/ ./metadata/
COPY migrations/ ./migrations/
COPY seeds/ ./seeds/
COPY config.yaml ./config.yaml

RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | VERSION=v2.34.0 bash