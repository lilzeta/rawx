#!/bin/bash
# if [[ ! -d "./src/ops/validation/schema" ]]; then
#     mkdir -p "./src/ops/validation/schema"
# fi
# npm run compile_validation
# mkdir -p ./dist/ops/validation
# cp -r ./src/ops/validation/schema ./dist/ops/validation
mkdir -p ./dist/modules
cp -r ./src/modules/* ./dist/modules/
npm pack
npm run re_i
