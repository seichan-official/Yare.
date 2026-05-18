.PHONY: build run-api run-worker migrate-up migrate-down sqlc-gen test lint docker-build

GOFLAGS := -ldflags="-s -w"

build:
	go build $(GOFLAGS) -o bin/api ./cmd/api
	go build $(GOFLAGS) -o bin/worker ./cmd/worker

run-api:
	go run ./cmd/api

run-worker:
	go run ./cmd/worker

migrate-up:
	migrate -path db/migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path db/migrations -database "$(DATABASE_URL)" down

sqlc-gen:
	sqlc generate

test:
	go test ./... -v -race

lint:
	golangci-lint run ./...

docker-build:
	docker build -f deployments/Dockerfile.api -t yare-api .
	docker build -f deployments/Dockerfile.worker -t yare-worker .

tidy:
	go mod tidy

.env:
	cp .env.example .env
