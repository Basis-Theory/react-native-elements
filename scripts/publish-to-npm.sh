#!/bin/bash
set -e

current_directory="$PWD"

cd $(dirname $0)/../dist

echo "🔐 Publishing with OIDC trusted publishing"

# Temporarily disable exit on error so we can inspect npm publish output
set +e
publish_output=$(npm publish --access public 2>&1)
publish_result=$?
set -e

if [ $publish_result -eq 0 ]; then
  echo "Package published successfully"
elif echo "$publish_output" | grep -q -E "(You cannot publish over the previously published versions|Cannot publish over the previously published versions|already exists|version already exists|EPUBLISHCONFLICT|You cannot republish a version that already exists)"; then
  echo "Package version already exists, skipping publish"
  echo "$publish_output"
  publish_result=0
else
  echo "Publish failed with exit code: $publish_result"
  echo "$publish_output"
fi

cd "$current_directory"

exit $publish_result
