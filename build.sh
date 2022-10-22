#!/bin/bash
tar="stage"
src="src"
dist="dist"
to_perl_reg=".ts$"
etc_reg=".json$"
# rm -rf "$tar" "$dist"
npm run clean
mkdir "$tar"
ts_list=()
unset cur_dir
stage() {
    if [[ ! -v cur_dir ]]; then
        cur_dir="$1"
    fi
    for a_path in $1/*; do
        if [[ -d "$a_path" ]]; then
            last_dir="$cur_dir"
            cur_dir="$a_path"
            stage "$a_path"
            cur_dir="$last_dir"
        else
            if [[ $a_path =~ $to_perl_reg ]] || [[ $a_path =~ $etc_reg ]]; then
                f="$(basename -- $a_path)"
                if [[ $f != "package.json" ]]; then
                    # echo "a_path: $a_path"
                    rr=${a_path%/*}
                    # echo "rr: $rr"
                    if [[ "$rr" == $src ]]; then
                        #sub_path=""
                        tar_path="$tar/$f"
                    else
                        sub_path="${rr#$src/}"
                        tar_path="$tar/${rr#$src/}/$f"
                        if [[ ! -d "$tar/$sub_path" ]]; then
                            # echo mkdir "$tar/$sub_path"
                            mkdir -p "$tar/$sub_path"
                        fi
                    fi
                    # echo "tar_path: $tar_path"
                    if [[ $f =~ $to_perl_reg ]]; then
                        # echo cp "$a_path" "$tar_path"
                        cp "$a_path" "$tar_path"
                        ts_list+=($tar_path)
                    else
                        # echo cp "$a_path" "$tar_path"
                        cp "$a_path" "$tar_path"
                    fi
                fi
            fi
        fi
        # echo $f
    done
}
stage "$src"
# echo "${ts_list[@]}"
for file in ${ts_list[@]}; do
    perl -i.bkp -pe 's/((?:log)|(?:accent)|(?:forky)|(?:errata))(\([^,]+,\s)/$1$2"L:$.", /' $file
done
# perl -i.bkp -pe 's/((?:log)|(?:accent)|(?:forky)|(?:errata))(\([^,]+,\s)/$1$2"L:$.", /' ${ts_list[@]}
# tsc -p "$tar/tsconfig.json"
npm run tsc
npm run re_i
