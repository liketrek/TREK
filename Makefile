STANDARDS_PROJECT := World-Travel
include ../make/standards.mk

.PHONY: setup start test check capture install-hooks

setup:
	npm ci

start:
	npm run dev

test:
	npm test

check:
	npm run lint
	npm run format:check
	npm run build

capture:
	CI=1 npm run shots --workspace=client

install-hooks:
	pre-commit install
