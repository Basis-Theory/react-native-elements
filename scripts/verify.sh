#!/bin/bash
set -e

current_directory="$PWD"

cd $(dirname $0)/..

yarn lint

yarn tsc --noEmit


#echo "Running tests..."

yarn test

result=$?

cd "$current_directory"

exit $result
