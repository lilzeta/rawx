#!/bin/bash
# a simple any version install shortcut
a_tgz=".tgz$"
if [[ $# -lt 1 ]]; then
    for a_path in ./*; do
        if [[ $a_path =~ $a_tgz ]]; then
            npm i "$a_path"
            break
        fi
    done
else
    for a_path in $1/*; do
        # echo "a_path: $a_path"
        if [[ $a_path =~ $a_tgz ]]; then
            # echo npm i "$a_path"
            npm i "$a_path"
            break
        fi
    done
fi
