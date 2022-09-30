## Rawx - Server Daemon
Typed & opinionated node.js module for running child-processes & hooks  
Server class is a process management class instantiated using JSON  
Watch class is a file watch that triggers on file changes (or saves)  
Ops is a class that conjoins a single node.js files' logs and configs  
These all have configs that are deeply explicated by instantiating json.  
  
Would like to work on log alignment but adding a lot may disrupt  
easy transfer, delicate. for now output looks like:  
  
![Alt text](https://github.com/lilzeta/rawx/blob/main/docs/screen1.PNG "rawx-out")  
need to add line break configs still (WIP)  
![Alt text](https://github.com/lilzeta/rawx/blob/main/docs/screen2.PNG "rawx-out2")  
  
License is entirely open, lets enable each-other in this way.  
Developers should not feel bad about the copy paste.  
Added this notice to the license to protect me, a freeware dev.  
```
Safety for hardware limits and for the stability of services,
while engaged in operating license.kind freeware is entirely
the responsibility of the developer or user running kind.
```
Please keep in mind that your process is your responsibility.  >.~`
  
Version 0.2.0, hooks, refactor of everything  
You may now need to enable certain things to use with a tsconfig  
The Ops class has a new convenience closure  
Server, Watch & Ops are all instantiated with fn calls = Server({...})  
Core is all now part of Ops and Server, Watch don't have superclass  
Except Server_Construct, an abstract class that is handling validation  
Switched to normal tsc for the compiler, way better typedefs now.  
For now `"type": "module",` in package.json is required.  
Focus is on stability of the es6 module currently.  
A PR for the cjs build is definitely welcome.  
  
Will try to get it tested on OSX & Linux soon  
Since I use Bash, I would guess it works on Linux also  
Probably needs some minor patches for OSX  
There are hooks now, adding an example. Works w/single file compiles.   
Example has Sass/Typescript, version 1 is no doubt gonna change.  
Only support is pure fn hook or exec lite callback.  next level...  
The Watch class now has deep support for explicated targets.
Use match: {...} now for all include/include_dir/exclude/exclude_dir  
Not supporting previous schema from 0.2, or publishing any new 0.1.x  
All examples are up to date and running, hopefully less narrow now.  
  
Added command repeaters here shown in/new first example following.  
```
    type: "spawn",
    command: "cp",
    args: [
        [`"${join(src_styles, "zsa.scss")}"`, `"${tar_styles}"`],
        [`"${join(dist_styles, "zsa.css")}"`, `"${tar_styles}"`],
        [`"${join(dist_styles, "zsa.css.map")}"`, `"${tar_styles}"`],
    ],
    // stop if error because it failed
    repeater_chain: "success",
```
  
Here is the simple case, stages external sources to local for publication  
I just made the repo that uses this and it is published here:  
[github/lilzeta/zen](https://github.com/lilzeta/zen)  
`npm i -D rawx`  
Run with command  
`node stage_zen.js`  
or use `scripts: {"start": "node stage_zen.js"}`  
`npm start` 
  
stage_zen.js  
```
import { join, resolve } from "path";
import { Server, some_colors, Ops } from "rawx";

const base = resolve(".");
const tar_base = resolve("src");
const tar_styles = join(tar_base, "styles");
const root = resolve("../..");
const base_ops = join(root, "o");
const base_pup = join(base_ops, "pup");
const src_styles = join(base_pup, "src", "pups", "styles");
const dist_styles = join(base_pup, "dist", "styles");

const debug = 4;
const o = Ops({ default: some_colors.TECHNICOLOR_GREEN, debug });
o._l(1, `pup_dist: ${dist_styles}`);

Server({
	name: "stage_zen",
	procs: [
		{
			type: "spawn",
			command: "rm",
			args: ["-rf", `"${tar_base}"`],
			chain_exit: true,
			shell: true,
            // prob unnecessary, be careful!
			cwd: base,
		},
		{
			type: "spawn",
			command: "mkdir",
			args: `"${tar_styles}"`,
			chain_exit: "success",
			silence: true,
		},
		{
			type: "spawn",
			command: "cp",
			args: [
				[`"${join(src_styles, "zsa.scss")}"`, `"${tar_styles}"`],
				[`"${join(dist_styles, "zsa.css")}"`, `"${tar_styles}"`],
				[`"${join(dist_styles, "zsa.css.map")}"`, `"${tar_styles}"`],
			],
			// stop if error because it failed
			repeater_chain: "success",
		},
	],
	debug,
	kill_delay: 400, // ssd/nvme fs speed
});
    debug, // 2 - 4 is good if you want start/close log lines
});  
```
This is a general node daemon, works for exec cargo, npm or general commands on path  
A more explicated format than nodemon or other similar methods.  
For the category it is lightweight, & for size journaling here is current stats.  
  
Major type changes, Server({...}) is now a function that operates  
within a small closure so it has a local env (for Ops)  
See the large example below for current Server usage/changes  
Need to redo typedefs for the new Abstract class typedefs  
Basically same as prev version, but wrapped in func closure/proxy/private class  
Functions as Procs is prototyped @ V0.2, expect issues.  
Added a preliminary example with what works for my case.  
```
Version 0.1.6  
27.1kB server.js
15.4kB server_construct.js
08.7kB watch.js - supports standalone use
09.7kB file_tree - will probably host in a new npm module
02.0kB tree_complex - will go with file_tree
15.7kB ops.js <- log config factories & core/util fn exports
04.2kB core.js <- packaged into ops now
03.3kB sub_proc.js - started this class to cleanup/support Server   
```
The module in your node_modules is kept unminified, no obtuse scaffolds  
Source is easily read/edited ES6 even as an npm install, literally is src   
If you are looking for a prod server this isn't it chief .dev  
Lean pretty hard on the throws, it's important to prevent bad args/setup  
See typedefs if something seems to not work proper, lots of recent charges  
make sure opts are up to date, Readme maybe not entirely accurate all the time  
Highly reccomend using a util class wrapped like ops.js  
It is a good shape to use as a starter for the pattern for your own.  
  
// ~ ~  Important gotches  
Note for bash or windows users  
~ alias npm="npm.cmd" can cause Ctrl-C to `hang` the process after a `Terminate (Y/N)`   
~ Also, not using `start` as the browser open command in windows will `hang`   
// ~~~  Please raise issues if you've found bugs in this category for any OS!  

/~/ export type str = string; this typedef is to help remove horizontal scrollbar  
from the inteface docs, if you are mad right now it's a rust format I like.  
Adding this line to important for that random extremely angry person  
somewhere sometime, here is me not apologizing and helping instead lol.  
  
For now use `path` via npm .resolve() to send an Array of (full file or full dir) paths.  
This will spawn watches for up to 6 levels of dir children per dir ref.  
Some relative paths may work now & match: {...} supports basic *.ext notation  
  
Here are some typedefs from interfacefiles, they are somewhat self explanatory.  
Procs is an array of Proc with these props  
a proc is a daemon passtrough to child-process\[type\](command+args)  
// ~ ~ Typescript typedefs ~ ~ //  
```
export type Type = Proc_Type | Hook_Type;
export type Proc_Type = "exec" | "spawn" | "execFile" | "fork";
export type Hook_Type = "fn" | "exec_fn";
// Core_Proc args used by the daemon
export interface Core_Proc {
    type: Type;
    // immediately start next proc when this proc exits
    // chain another on "success"(exit 0) || any exit
    chain_exit?: "success" | true;
    // Option to goto index instead of next
    chain_next?: number;
    // Set index for next watch trigger on failure
    chain_failure?: number;
    // if not falsey defaults to "success"
    on_watch?: true; // delay start till a watch/trigger
    run_if_file_dne?: str; // only run if file @ path D.N.E.
    goto_on_file_exists?: number; // skip to proc# if_file exists
    concurrent?: A_Proc_Arg; // chain another now
    // where concurrent: {...Proc} <- is a Proc
    delay?: number; // wait to start self, Def: 0ms
    // on trap unwatch all after a self triggered
    trap?: true; // remove filewatch permanently
    silence?: Silencer;
}
export interface Proc_Arg_Exec extends Core_Proc {
    type: "exec"; // child-process[type]...
    command: str; // ...[type](command ...)
}
export interface Proc_Arg_Def extends Core_Proc {
    type: "spawn" | "execFile"; // child-process[type]...
    command: str; // ...[type](command ...)
    args?: Array<str>; // ...](command ...args)
    cwd?: str; // working path (WIP)
    shell?: true; // passthrough  (WIP)
}
// No shell arg
export interface Proc_Arg_Fork extends Core_Proc {
    type: "fork"; // child-process[type]...
    module: "str";
}
// some => just on start&close messages
export type Silencer = "some" | "all";
export type Proc_Args = Array<Proc> | Proc;
```
Anything with a ? is opt into feature, no arg = no feature  
For example  
```   
on_watch?: true
// chain_exit chain stops at proc till watch trigger
on_watch: true
// lint error, or does nothing
on_watch: false
// ~ ~
chain_exit?: true | "success" 
// execute next when proc exits
chain_exit: true
// execute next when proc exits with code: 0
chain_exit: "success"
```
  
Arguments to the Server class constructor  
```
// verbose/all set to 10
export type Debug = number | undefined;
export interface Server_Args {
    name: str; // start/stop labeling
    procs: Proc_Args; // proc or procs
    proc: Proc_Args; // both => Throw Error
    // Note: `trigger` means `watch trigger`
    trigger_index?: number; // restart from index on trigger
    trigger_indices?: number[]; // length should match watch.paths
    watch: {
        paths: Array<str>; // dir or file full paths
        // WIP `complex` Modality,
        // prototype working for full trigger explication
        complex?: Array<Complex>;
        match?: Matchers;
        delay?: number;
        poll: number;
        debug?: Debug; // or uses Server one
        colors?: Color_Targets; // or uses Server one
    };
    colors?: Color_Targets; // or uses defaults
    //  silent 0 <-> 10 verbose
    debug?: Debug;
    log_ignore_reg_repl?: { reg: RegExp; replace?: string }[];
    kill_delay?: number; // post kill wait in ms
    output_dir?: str; // multi path helper
    first_proc?: number; // default: 0
    // "handled" to not terminate on (Ctrl-C)
    sig?: "handled"; // not recommended
}
```
Colors
```
export interface Color_Targets {
    // Class name color
    label: str; // "" for no labeling
    // All sub-proc labelling
    default: str;
    // Accented for attention
    accent: str;
    // Start/Close/Proc specific
    forky: str;
    errata: str;
    // The `-` between label & log
    fleck: str; // "" for no fleck
}
```
This is at the top of basically any TS I write off corp.  
Tried to consolidate things I use across rawx to Ops.  
```
import { Ops, some_colors } from "rawx";
let o = Ops({
	colors: {
		default: some_colors.TECHNICOLOR_GREEN,
		forky: some_colors.LAVENDER,
		label: some_colors.TECHNICOLOR_GREEN,
		fleck: some_colors.TECHNICOLOR_GREEN,
		accent: some_colors.NEON_YELLOW,
	},
});
// where some_colors =>
export const some_colors = {
	TECHNICOLOR_GREEN: `[0;36m`,
	LAVENDER: `[1;34m`,
	H_RED: `[1;31m`,
	PURPLE: `[0;35m`,
	D_BLUE: `[0;34m`,
	NEON_YELLOW: `[1;33m`,
};
```
Default colors
```
    ...
    colors: {
        label: some_colors.LAVENDER,
        default: some_colors.TECHNICOLOR_GREEN,
        forky: some_colors.PURPLE,
        accent: some_colors.D_BLUE, // TODO oops darkly
        errata: some_colors.H_RED,
        fleck: some_colors.D_BLUE,
    }
```
This is the typedef for Ops
```
export interface Ops {
    debug: Debug;
    colors: Color_Targets;
    label: str;
    _l: Log;
    accent: Log;
    forky: Log;
    errata: Log;
    // The following 4 may move out of this
    prefix: LabelWrap; // subproc ops...
    post: PostWrap;
    sub_proc_prefix: IO;
    stdout: Std_IO;
    // aliases of Core super methods
    defi: Core["defi"];
    empty: Core["empty"];
    truncate: Core["truncate"];
    wait: Core["wait"];
    pretty: Core["pretty"];
    compound_map_to_arg: Arg_Map;
    puff: Core["puff"];
}
```
Some of the weirder ones need docs still  
internally the escape is appended before using colors  
aka const LAVENDER = `\x1B[1;34m` after constructor  
Externally you can call Ops({...})  
to get utils, passing that function any color or overrides  
Don't append the escape externally  
Here is a way to do TERM colors if you wanna roll your own  
```
	prep: = (color: str) => {
		process.stdout._write(color,"utf8",() => {});
	};
	post: ColorNope = () => {
		process.stdout._write("\x1B[0m", "utf8", () => {});
	};
	this.prep(color);
	process.stdout._write(some_string); // some_string + \n maybe
	this.post();
```
written this way it's a 'utf8' string, not 'hex' string  
  
The watcher is a `**/\*.\*` on any dir-full-path passed in `watch[]`  
Except what matches or doesn't from `match: {...}`  
Support for relative args and *.ext has some basics working.  
Probably use a lib if anyone cares to make a suggestion.  
  
Next config example is operating a web_app with a local_store partner server   
// ~ ~  Concurrent Server / conjoined logging ~ ~ //  
```
import path from "path";
import { Server, some_colors } from "rawx";
import dot_env_module from "dotenv";
// .env @ the top of project
const dot_env = dot_env_module.config({ path: ".env" }).parsed;
const { WEB_APP_PORT } = dot_env;

const debug = 3;
const web_context = path.resolve(".");
const storage_api_context = path.resolve(web_context, "storage_api");
let shared_files = [path.join(web_context, "shared")];
shared_files.push(path.join(web_context, "global.d.ts"));
// ~ ~ ~ express storage_server ~ ~ ~
Server({
    name: "storage_api_server",
    procs: [
        {
            type: "exec",
            command: `npm run storage_clean`,
            chain_exit: true, // no files don't care
            silence: "all",
            delay: 0,
        },
        {
            type: "exec",
            command: `npm run storage_build`,
            chain_exit: "success", // trigger next on exit 0
            delay: 100,
        },
        {
            type: "exec",
            command: `npm run storage_run`,
            delay: 3000, // a healthy wait for port
        },
    ],
    watch: {
        paths: [storage_api_context].concat(shared_files),
        match: {
            exclude_dir: /(?:backup_data)|(?:file_store)/,
            include: ["*.tsx", "*.ts"],
        },
        // 4s seems semi alert
        poll: 4000,
    },
    trigger_index: 0, // always start from 0
    colors: {
        default: some_colors.TECHNICOLOR_GREEN,
        forky: some_colors.LAVENDER,
        fleck: some_colors.TECHNICOLOR_GREEN,
        label: some_colors.TECHNICOLOR_GREEN,
        accent: some_colors.NEON_YELLOW,
    },
    debug,
});

const web_app_root = path.join(web_context, "web_app");
// run the web app in production/static (at first), after clean and initial build
let prod_web_dist = path.resolve("dist", "web_app");
```
note I have serve installed globally as per their docs  
[npmjs npx serve](https://www.npmjs.com/package/serve)  
not part of rawx  
```
let prod_web_run = `npx serve -l ${WEB_APP_PORT} ${prod_web_dist}`;

const root_dir = path.resolve("/");
const app_data_local = path.join(root_dir, "Users", "lil_z", "AppData", "Local");
const chrome = path.join(app_data_local, "Chromium", "Application", "chrome_proxy.exe");
// args could be in the case of puppeteer:ws browser on localhost
const browser_args = [
    `${chrome}`,
    "--remote-debugging-port=9222",
    "--user-data-dir=remote-profile",
    "http://localhost:6318",
];
const open_browser_proc = {
    type: "exec",
    command: "start",
    args: browser_args,
    delay: 10000,
};

// ~ ~ web_server ~ ~
// web_procs blow by blow
// web_procs[0, 1, 2] - prod web_app - low-energy (spin-quiet) for a non focused server
// web_procs[2] also runs open_browser_proc which has a delay for prod_web_run to complete
// web_procs[0, 1, 2] good for a service-like process that is low noise/energy/background
// web_procs[2] convert to webpack-dev-server web_proc[3] on file watch change
// web_procs[3] runs shadowed available on the same port unused till a manual browser refresh
// after refresh - webpack-dev-server has hot module replacement
// web_procs[2] -> web_proc[3] removes the watches i.e. "trap": true
// note [2] -> [3] is the only time watch of src files triggers this server
Server({
    name: "web_server",
    procs: [
        {
            type: "exec",
            command: `npm run web_app_clean`,
            // watch for exit -> start next proc
            chain_exit: true, // no files don't care
            silence: "all",
        },
        {
            type: "exec",
            command: `npm run web_app_prod_build`,
            // iff exit 0 start next
            chain_exit: "success",
            delay: 100,
        },
        {
            type: "exec",
            command: `${prod_web_run}`,
            // when proc start() -> also open browser
            concurrently: open_browser_proc,
            delay: 500,
        }, // No chain_exit here!
        {
            type: "exec",
            command: "npm run web_app_dev_no_open",
            // trap => clear all watches
            trap: true,
            delay: 4000, // a healthy wait for port to clear
        },
    ],
    // incase of error on 0/1/2, next watch triggers 3 & trap
    trigger_index: 3,
    watch: {
        paths: [web_app_root].concat(shared_files),
        // 30s is sleepy. Only once then webpack handles
        poll: 30000,
        colors: {
            default: some_colors.forky,
        },
        match: {
            include: ["*.ts", "*.scss"],
        },
        // debug: 10,
    },
    debug,
    colors: {
        default: some_colors.D_BLUE,
        forky: some_colors.PURPLE,
        label: some_colors.D_BLUE,
        fleck: some_colors.D_BLUE,
        accent: some_colors.NEON_YELLOW,
    },
});
// ~ ~ ~
// package.json
scripts: {
	"storage_clean": "rimraf \"storage_api_dist\"",
	"storage_build": "webpack build --config \"storage_api/webpack.storage.config.js\"",
	"storage_run": "node \"dist/storage_api/index.cjs\"",
	"web_app_clean": "rimraf \"web_app_dist\"",
	"web_app_prod_build": "webpack build --config \"web_app/webpack.web_app.config.js\"",
	"web_app_dev_no_open": "webpack-dev-server --mode development --config \"web_app/webpack.web_app.config.js\"",
	"web_app_dev": "webpack-dev-server --mode development --open --config \"web_app/webpack.web_app.config.js\"",
	"start": "node start_web.js",
	"reref": "npm i -D \"../rawx/dist/rawx-0.2.xy.tgz\""
}
```
Note currently calling storage_api_server.die() will cause web_server to unwatch shared_files  
I have some unused wrapper code for the watch trigger in WIP  
If you pass the trigger to unwatch, it will only unwatch that trigger.  
This will get fixed when time is dedicated to testing it, since it uses the same class function.  
  
<>  
If you watch a root dir, don't double watch inner directories.  
It only allows one active pipe/proc at a time, but you don't need another.  
It now kills any active chain procs on every new watch trigger  
This means saving a file during a build woud start it over   
Not decided on exactly what to do about a /dist in src under a weird alias.  
</>  
  
The function hooks are WIP, just got a couple types working  
works w/single file compile - sass, and tsc  
Here is the singular case I've tested as working (prototype phase)  
Also example of complex, and the match permutations I've tested.  
Also these are new: 
```
chain_exit: "success",
chain_next: 3,
chain_failure: 0,
```
```
import path, { join } from "path";
import { Server, some_colors } from "rawx";
const pup_context = path.resolve("src");
// Puppetry ...hup
// const pup_entry_ts = path.join(pup_context, "pup.ts");
export const env = path.resolve("env");
const dist = path.resolve("dist");
const styles_dist = path.join(dist, "styles");

Server({
	name: "pup_ts",
	procs: [
		{
			type: "exec",
			command: "npm run build",
			chain_exit: "success",
			chain_next: 3,
			chain_failure: 0,
		},
		{
			type: "exec_fn",
			on_watch: true,
            // fn is in a promise 
            // when callback(0) chain_next: 3
			chain_exit: "success",
			chain_next: 3, 
			fn: ({ callback, file_path, fail: _ }) => {
				console.log(`file_path`);
				console.log(file_path);
				const file_name = /(?:[\\\/]+)([^\\\/]*).scss$/.exec(file_path)?.[1];
				const out_file = join(styles_dist, file_name) + ".css";
				console.log(out_file);
				callback({
					command: `sass "${file_path}" "${out_file}"`,
				});
				// `sass source/index.scss css/index.css`,
			},
		},
		{
			type: "exec_fn",
			on_watch: true,
			chain_exit: "success",
			chain_next: 3,
			fn: ({ callback, file_path, fail: _ }) => {
				console.log(`file_path`);
				console.log(file_path);
				const match = /([^/\\]*)(?:\/|\\)([^/\\]*).ts$/.exec(file_path);
				const folder = match?.[1];
				const filename = match?.[2];
				const out_file = join(dist, folder, filename) + ".ts";
				callback({
					command: `tsc --target es2020 --moduleResolution node16 --allowSyntheticDefaultImports true --module node16 --outDir "${dist}" "${file_path}"`,
				});
				// Need to use tsconfig.json, prototype works
				// TODO typedefs SFC
			},
		},
		{
			type: "exec",
			command: "node dist/entry/browser_open.js",
		},
	],
	watch: {
		// paths: [pup_context, env],
		match: {
			// include: [/\.ts$/],
			// exclude: [/\.scss$/],
			// include: [/\.scss$/],
			// exclude: [/\.ts$/],
		},
		complex: [
			{
				paths: [pup_context],
				trigger_index: 1,
				match: {
					include: [/\.scss$/],
					// 	exclude: [/\.ts$/],
				},
			},
			{
				paths: [pup_context],
				trigger_index: 2,
				match: {
					include: [/\.ts$/],
					// exclude: [/\.scss$/],
				},
			},
		],
		debug: 10,
	},
	out: "dist",
	colors: {
		default: some_colors.TECHNICOLOR_GREEN,
		lightly: some_colors.LAVENDER,
		forky: some_colors.D_BLUE,
		errata: some_colors.NEON_YELLOW,
		accent: some_colors.NEON_YELLOW,
	},
	trigger_index: 0,
	debug: 9,
});
```
  
## Known Issues aka rough Todo in order of priority
Here are next goals, when or ... if  
###  High  
- [ ] - Test Fork / get Fork.cwd working (maybe a related node.js bug?) 
- [x] - Proper Typedefs for Server args autocomplete & linting  
- [ ] - Chaperone for chain-exit to dis-allow continuous chaining (throw?)  
- [ ] - Along with ^last chaperone watch of dist/out in src under any weird alias  
- [ ] - Watch.unwatch() to pass trigger to fs.unwatch, so it will only unwatch that trigger  
- [ ] - Test already enabled cwd/shell args for use w/Proc (tested some)
  
### Medium  
- [x] - Single file compile  
is resolving ~ (Home) is desired?  
Enable Fork Proc intersticiale communicatado w/hooks (sp.)  
Determine a proper test library, Jest? Its a passion proj...  
  
### Lower priority, possibly never
Document Watch class, (use it directly, why?)  
Read mote of the node child-process codebase  
uuid, research why exactly is Math.random bad? (see crypto?)  
  
// ~ ~  
There are a couple working servers in ./test/...  
They are a bit strange as they involve self compile.  
This is a good place to stop if you are just using `rawx` typically, good hunting.  
// ~ ~  
  
Here is a meta(ish) watcher that also restarts the proc if the node.js server file changes  
Including this specialied example for hints toward similar attempts  
__ ignore example if you don't enjoy cmdline much, this example uses bash __   
```
// ~ < .bashrc > ~
#!/bin/sh
export _rig="/c/e/rig" # script folder
alias rig_="cd $_rig"
export the_rig="/c/e/rig/_.js"
# because npm scripts don't easily utilize argv
# note: now n_s with args always forwards to this singleton
# while n_s alone runs some relative npm start
n_s() {
	if [[ $# -lt 1 ]]; then
		npm start
	else
		# // just - cd "$_rig"
		rig_
		# runs node _.js args[...]
		node "$the_rig" "$@"
	fi
} # the_rig uses other projects package.json to ref full/global paths via _.js
// ~ </.bashrc> ~
// ~ < /c/e/rig_.js > (the rig) ~
import process from "process";
import { join, resolve } from "path";
import { Server, some_colors, Ops } from "rawx";

export const debug = 3;
const o = Ops({ default: some_colors.TECHNICOLOR_GREEN, debug });

const usage = `[L:09] n_s -> _.js -> call w/ " pup | home | 'tu'(be) | 'ok'(ini)" `;
if (process.argv.length < 3) {
    o.errata(1, usage);
    exit;
}
// The name of npm script = `start_${this_rig}`
const this_rawx = process.argv[2];
const root = resolve("..");
const ops = join(root, "o");
const code = join(root, "c");

// } else if (this_rawx === "home") {
//     dir = join(ops, "home");
//     node_js_target = `${npm_script_name}.js`;
// } else if (this_rawx === "pup") {
const targets = {
    ok: [ops, "ini.js"],
    home: [code],
    pup: [ops],
    tu: [code, `be.js`],
};
const target = targets[this_rawx];
if (!Array.isArray(target)) {
    if (!node_js_target || !dir) {
        o.errata(1, usage);
        exit;
    }
}

const dir = join(target[0], this_rawx);
let node_js_target = `start_${this_rawx}`;
if (target.length > 1) {
    node_js_target = node_js_target += target[1];
} else {
    node_js_target += ".js";
}
const target_pkg_conf = join(dir, "package.json");
const nodejs_fullpath = join(dir, node_js_target);
Server({
    name: "",
    procs: [
        {
            type: "spawn",
            command: "node",
            args: [join(dir, node_js_target)],
            // command: join(dir, node_js_target),
            // args: [node_js_target],
            cwd: dir,
        },
    ],
    watch: {
        paths: [nodejs_fullpath, target_pkg_conf],
    },
    colors: {
        label: "",
        fleck: "",
    },
    trigger_index: 0,
});
// ~ </ /c/e/rig_.js > (the rig) ~
```
Explanation if you didn't grok. 
Each ref'd project has a script at the root `start_[nickname].js` which rig runs.  
Coincidentally each proj has a script "start": "node start\[nickname\].js"  
Inside project dir `n_s` alone runs the node.js server directly.  
At every path, `n_s [nickname]` runs the named `start_[nickname].js`  
at the correct cwd path using rig.  
We could also chain in npm i as a package.json watch change with this strategy.  
This is either rad or boring to you depending on your current 0010z.  
Would not work to verbatem reuse code in this model,  
unless you happen to use a bash with dev on a drive mounted at root.  
## Etcetera Notes
cwd/shell args for Proc is untested, will likely do that soon.  
proc is pretty close to a passthrough message to `child-process[type]`  
Ways to go till there are any typedef-safe-checks operational.   
  
I recently moved process.on("SIGINT") inside Server  
If you need to override, do that as follows    
```
let server = Server({...
    name: "start_some",
    procs: [...],
    watch: [...],
    sig: "handled"
});
// now you need to call die() on sigint on your own
// this is basically the same as internally
process.on("SIGINT", function () {
	server.die();
	console.log(`[000], shutting down complete -> exit`);
	process.exit();
});
```
# More etcetera
uuid is the standard for hash id, haven't peeked src yet  
plan on making use of ids more now that procs get tagged  
You can use the watcher directly as a class if you want  
it's a direct filewatch, tree-kill was necessary  
to terminate the sub-procs things like npm spawn   
  
## repo as dev
After removing tsc-esm it was necessary to put tsc on path  
  
`npm run build && npm run manual_post_build`  
prebuild: clean & build & npm copy in prepack
  
`npm run release`  
^build^ & pack  
This packages dist as a node module xyz.tgz  
after the package is in dist @ `dist\rawx-0.x.y.tgz`  
You may install that .tgz like a published module from _another_ proj as follows  
```
npm i "full_or_rel/path/dist/rawx-0.x.y.tgz"  
# or  
n_i "C:\\...full_or_rel\\\rawx\\dist\\rawx-0.x.y.tgz"  
# or use npm link  
# or use this repo as a stub to run the TS directly (untested)  
```
Submit a PR if you want, I won't consider adding huge bloat  
Suggestions? Improvements? It's freeware, go ahead =)    
As for merges, my coding style since I gave up QWERTY is quite non-standard  
Anything_merged_would_likely_receive_fair_mod_if_ications and be license.kind    
FYI, underscore under a finger at rest is a speed coding superpower... but ugly  
  
## Bumping packages for pull request
To expediate re-pack version-ups if you need that ->  
```
rm -f node_modules package-lock.json  
npm i --save path tree-kill uuid @types/uuid  
npm i -D typescript rimraf typescript @types/node  
// note: path uuid & tree-kill are the external install deps  
```   
Apologies if I don't see the PR immediately  
License is freeware.kindware ~ license.kind ~ repackage however you wish    
## If You_
_are a profesional ops person and have forked or repacked this module,  
for use as a production env. executor, please raise an issue with your work!  
w/a link, w/a gist or a repo for this repo's benefit, would love to see it.  
I've some enterprise experience w/web prod architecture (aka webpack).  
Could go for some enterprise operations experience in this vein (linux only?).  
  
## util.format WIP
[Node Docs: util.format(format[, ...args])](https://nodejs.org/api/util.html#utilformatformat-args)  
Just enabled util.format for Array/Object and is WIP 
looks nice but it is not thoroughly tested   
%j - JSON. [Replaced with the string '[Circular]' (<-yo!*)]  
if the argument contains circular references.  
TODO Object options?  
%o - Object  
with options { showHidden: true, depth: 4, showProxy: true }  
TODO symbols?  
This will show the full object including non-enumerable symbols and properties.  
%O - Object. A string representation of an object with generic  
JavaScript object formatting. Similar to util.inspect() without options.  
This will show the full object not including non-enumerable symbols and properties.  
  
Proofreader eye twitching from a grammars_lol passthrough?  
Please open a PR or a google docs speadsheet to explicate my crimes.  
  
Caring is cool.   
<>|WIP Forever|</>  
Nope  
