# Server Daemon
Typed & opinionated node.js module for runnng child-process exec groups  
along-side with associated watch targets.  

Version 0.1.6 feels stable, bumped the minor finally  
Use "moduleResolution": "node16" in your tsconfig now to use this
The Ops stuff will likely get a closure like Server & Watch  
Still haven't gotten Typescript def files packaged proper  
Switched to normal tsc for the compiler  
Will try to get it tested on OSX & Linux soon  
Since I use Bash, I would guess it works on Linux also  
Probably needs some minor patches for OSX  
Configuration of the Ops/Log class has gotten heavier  
Ops is appropriately modular now  
  
Here is the simple case that is a common nodemon process  
`npm i -D rawx`  
```
// in start_tube.js
import path from "path";
import { Server } from "rawx";

const src = path.resolve("src");
const pkg = path.resolve("Cargo.toml");

// No new class keyword now!  
// let server =
Server({
    name: "start_tube",
    procs: [
        {
            type: "exec",
            command: "cargo",
            args: ["run", "tube"],
        },
    ],
    // takes files & directories watches files within directories
    watch: {
		paths: [src, pkg],
	}
});  
// node start_tube.js
// or scripts: {"start": "node start_tube.js"}
```
This is a general node daemon, works for exec cargo, npm or general commands on path  
A more explicated format than nodemon or other similar methods.  
For the category it is lightweight, & for size journaling here is current stats.  
  
Major type changes, Server({...}) is now a function that operates  
within a small closure so it has a local env (for Ops)  
See the large example below for current Server usage/changes  
Need to redo typedefs for the new Abstract class typedefs  
Basically same as prev version, but wrapped in func closure/proxy/private class  
```
Version 0.1.6  
18.3kB server.js  
08.9kB watch.js  
15.2kB ops.js <- new Ops class with log config factories  
03.1kB core.js  
```
The module in your node_modules is kept unminified, no obtuse scaffolds  
Source is easily read/edited ES6 even as an npm install, literally is src   
If you are looking for a prod server this isn't it chief .dev  
Lean pretty hard on the throws, it's important to prevent bad args/setup  
See typedefs if something seems to not work proper, lots of recent charges  
make sure opts are up to date, Readme maybe not entirely accurate all the time  
  
// ~ ~  Important gotches  
Note for bash or windows users  
~ alias npm="npm.cmd" can cause Ctrl-C to `hang` the process after a `Terminate (Y/N)`   
~ Also, not using `start` as the browser open command in windows will `hang`   
// ~~~  Please raise issues if you've found bugs in this category for any OS!  

~ export type str = string; this typedef is to help remove horizontal scrollbar  
from the inteface docs, if you are mad right now it's a rust format I like.  
Adding this line to important for that random extremely angry person  
somewhere sometime, here is me not apologizing and helping instead lol.  
  
For now use `path` via npm .resolve() to send an Array of (full file or full dir) paths.  
This will spawn watches for up to 6 levels of dir children per dir ref.  
  
Here are some typedefs from interface.ts, they are somewhat self explanatory.  
Procs is an array of Proc with these props  
a proc is a daemon passtrough to child-process\[type\](command+args)  
  
// ~ ~ Typescript typedefs ~ ~ //  
```
export interface Proc extends String_Keyed {
	type: Proc_Type;     // child-process[type]...
    command: str;        // ...[type](command ...)
    args?: Array<str>;   // ...](command ...args)
	// immediately start next proc when this proc exits
    // chain another on "success"(exit 0) || any exit
    chain_exit?: "success" | true; 
	// if not falsey defaults to "success"
	on_watch?: true;     // delay start till a watch/trigger
	if_file_dne?: str;   // only run if file @ path D.N.E.
    concurrent?: Proc;   // chain another now
    // where concurrent: {...Proc} <- is a Proc
    delay?: number;      // wait to start self, Def: 0ms
    // on trap unwatch all after a self triggered
    trap?: true;         // remove filewatch permanently
    silence?: Silencer;  // no stdout/console from Proc
    cwd?: str;           // working path (untested)
    shell?: true;        // passthrough  (untested)
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
    name: str;            // start/stop labeling
    procs: Proc_Args;     // proc or procs
    proc: Proc_Args;      // both => Throw Error
	// Note: `trigger` means `watch trigger` & replaces .tramp, 
	trigger_index?: number; // restart from index on trigger
    watch: {
        paths: Array<str>;// dir or file full paths
        ignore?: RegExp[];// Regex array to not watch any match
        delay?: number;
        poll: number;
        debug?: Debug;    // or uses Server one
		colors?: Colors;  // or uses Server one
    };
    colors?: Colors;      // or uses defaults
    // true | 0->10 | "verbose" (verbose=10)
    debug?: Debug;
	log_ignore?: {reg: RegExp, replace?: string}[];
    kill_delay?: number; // post kill wait in ms
    // "handled" to not terminate on (Ctrl-C)
    sig?: "handled";
	override_trigger?: ()=>void;
    // WIP ignore delays on Proc exit/kill
    // all_proc_immediate?: true;
}
```
Colors
```
export interface Color_Targets {
	// for Server.Name
	label: str;
	default: str;
	lightly: str;
	forky: str;
	errata: str;
	fleck: str;
}
// Starter paste for any targets
export const Colors = {
	TECHNICOLOR_GREEN: `[0;36m`,
	LAVENDER: `[1;34m`,
	H_RED: `[1;31m`,
	PURPLE: `[0;35m`,
	D_BLUE: `[0;34m`,
	NEON_YELLOW: `[1;33m`,
};
// {default: ""} will cause no proc coloring
// {fleck: ""} will cause no dash after <${name}|Server>
```
Default colors
```
const colors = {
	label: Colors.LAVENDER,
	default: Colors.TECHNICOLOR_GREEN,
	forky: Colors.PURPLE,
	lightly: Colors.D_BLUE, // TODO oops darkly
	errata: Colors.H_RED,
	fleck: Colors.D_BLUE,
};
```
  
Instantiate an Ops class if you want to for anything  
internally the escape is appended before using colors  
aka const LAVENDER = `\x1B[1;34m` after constructor  
Externally you can call Ops_Generator.ops_with_conf()  
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
> license.kind  
written this way it's a 'utf8' string, not 'hex' string  
  
// ~ ~    ~     ~ ~  
Sometimes it takes some fiddling with the proc types/args/cwd   
Since they are concise I write the servers in .js  
even though rawx is written in typescript  
(build for use in TS might not be quite right yet)  
I need to get some tests going for stability.  WIP  
  
The watcher is a **/\*.\* on any dir-full-path passed in `watch[]`  
Support for relative args will happen when it's gotten to  
  
Here is a medium-size use case, it may explain the... but why?  
Config example to operate a web_app with a local_store partner server   
  
// ~ ~  Concurrent Server / conjoined logging ~ ~ //  
```
import path from "path";
import { Server } from "rawx";

import dot_env_module from "dotenv";
// .env @ the top of project
const dot_env = dot_env_module.config({ path: ".env" }).parsed;
const { WEB_APP_PORT } = dot_env;

const colors = {
    TECHNICOLOR_GREEN: `[0;36m`,
    LAVENDER: `[1;34m`,
    H_RED: `[1;31m`,
    PURPLE: `[0;35m`,
    D_BLUE: `[0;34m`,
    NEON_YELLOW: `[1;33m`,
};

const debug = 2;
const web_context = path.resolve(".");
const storage_api_context = path.resolve(web_context, "storage_api");
let shared_files = [path.join(web_context, "shared")];
shared_files.push(path.join(web_context, "global.d.ts"));

// setup the express storage_api_server
let storage_procs = [];
storage_procs.push({
    type: "exec",
    command: `npm run storage_clean`,
    chain_exit: true, // no files don't care
    delay: 100,
});
storage_procs.push({
    type: "exec",
    command: `npm run storage_build`,
    chain_exit: "success", // trigger next on exit 0
    delay: 100,
});
storage_procs.push({
    type: "exec",
    command: `npm run storage_run`,
    delay: 4000, // a healthy wait for port
});

// ~ ~ storage_server ~ ~
Server({
    name: "storage_api_server",
    procs: storage_procs,
    watch: {
        files: [storage_api_context].concat(shared_files),
        watch_ignore: /\/|\\(?:backup_data)|(?:file_store)/,
        poll: 4000,
    },
    trigger_index: 0, // always start from 0
    colors: {
        default: colors.LAVENDER,
        forky: colors.PURPLE,
        fleck: colors.LAVENDER,
        label: colors.LAVENDER,
        lightly: colors.NEON_YELLOW,
    },
    debug: 2,
});

const web_app_root = path.join(web_context, "web_app");
// run the web app in production/static (at first), after clean and initial build
let prod_web_dist = path.resolve("dist", "web_app");
// note I have serve installed globally as per their docs
// [https://www.npmjs.com/package/serve](npmjs npx serve) - not part of rawx
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

// web_procs blow by blow
// web_procs[0, 1, 2] - prod web_app - low-energy (spin-quiet) for a non focused server
// web_procs[2] also runs open_browser_proc which has a delay for prod_web_run to complete
// web_procs[0, 1, 2] good for a service-like process that is low noise/energy/background
// web_procs[2] convert to webpack-dev-server web_proc[3] on file watch change
// web_procs[3] runs shadowed available on the same port unused till a manual browser refresh
// after refresh - webpack-dev-server has hot module replacement
// web_procs[2] -> web_proc[3] removes the watches i.e. "trap": true
// note [2] -> [3] is the only time watch of src files triggers this server
let web_procs = [
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
        delay: 50,
    },
    {
        type: "exec",
        command: `${prod_web_run}`,
        // when proc start() -> also open browser
        concurrently: open_browser_proc,
        delay: 1000,
    },
    {
        type: "exec",
        command: "npm run web_app_dev_no_open",
        // trap => clear all watches
        trap: true,
        delay: 4000, // a healthy wait for port
    },
];
// ~ ~ web_server ~ ~
Server({
    name: "web_server",
    procs: web_procs,
    trigger_index: 3,
    watch: {
        paths: [web_app_root].concat(shared_files),
        poll: 30000,
        // incase of error on 0/1/2 later a watch triggers 3
        debug: 10, // noisy for new config => <3/4 normally
        colors: {
            default: colors.D_BLUE,
            forky: colors.D_BLUE,
            label: colors.D_BLUE,
            fleck: colors.D_BLUE,
            lightly: colors.D_BLUE,
        },
    },
    debug,
    colors: {
        default: colors.TECHNICOLOR_GREEN,
        forky: colors.D_BLUE,
        label: colors.TECHNICOLOR_GREEN,
        fleck: colors.TECHNICOLOR_GREEN,
        lightly: colors.NEON_YELLOW,
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
	"reref": "npm i -D \"../rawx/dist/rawx-0.1.0.tgz\""
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
This is not how it currently operates, could be bad if you watch dist on accident.  
Not decided on exactly what to do about a /dist in src under a weird alias.  
</>  

## Known Issues aka rough Todo in order of priority
Here are next goals, when if    
###  High  
- [ ] - Proper Typedefs for Server args autocomplete & linting  
- [ ] - Chaperone for chain-exit to dis-allow continuous chaining (throw?)  
- [ ] - Along with ^last chaperone watch of dist/out in src under any weird alias  
- [ ] - Watch.unwatch() to pass trigger to fs.unwatch, so it will only unwatch that trigger  
- [ ] - Test already enabled cwd/shell args for use w/Proc  
  
### Medium  
- [ ] - Single file compile sounds cool, but sort of fringe?   
- [ ] - Read `path` docs & use path.resolve to allow/use relative paths also  
In ^last determine if resolving ~ (Home) is desired?  
Determine a proper test library, Jest?  
Right now we ignore any circular proc reference, thats temporary ;)  
  
### Lower priority, possibly never
Document Watch class, (use it directly, why?)  
Read the node child-process codebase? is it Open Source?  
uuid, research why exactly is Math.random bad? (see crypto)  
  
// ~ ~  
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
// Rest of example is outdated, WIP updating to 0.1
// ~ < /c/e/rig_.js > (the rig) ~
import process from "process";
import path from "path";
import { Server } from "rawx";
const local_pkg_conf = path.resolve("package.json");
console.log("[L:8] <_.js> - rig \\_ begin");

if (process.argv.length < 3) {
    console.log(`[L:11] n_s -> _.js -> call w/ " home | oki .... `);
    exit;
}

const this_rawx = process.argv[2];
// The name of npm script in other proj : `start_${this_rawx}.js`
// The name of npm script will call
const npm_script_name = `start_${this_rawx}`;
// target of npm_script js files matching npm scripts (to watch for changes)
// optionally in the strategy as it just uses the altenate npm start via the proj
let node_js_target, cd_;
const root = path.resolve("..");
const ops = path.join(root, "o");
const code = path.join(root, "c");
if (this_rawx === "oki") {
    cd_ = path.join(ops, "oki");
    node_js_target = `${npm_script_name}ni.js`;
} else if (this_rawx === "home") {
    cd_ = path.join(code, "home");
    node_js_target = `${npm_script_name}.js`;
} else...{}
if (!node_js_target || !cd_) {
    console.log(`[L:11] n_s -> _.js -> call w/ " home | web | oki ... `);
}

// note cd_ is prob a solid os string if created like this  
// cd `$foo` && ... = in a subshell prepending the exec `cd ...`
// note this is just a single file watch, single proc restarter (a meta-ish watch-restart)
let procs = [{ type: "exec", command: `cd ${cd_} && node ${node_js_target}` }];
const rel_single_file_watch = `${cd_}/${node_js_target}`;
// console.log(JSON.stringify(procs, null, 2));
Server({
	name: "_", // or "rig" or ""
	procs,     // singular proc (proc as an option name is TBD)
	watch: {
		paths: [rel_single_file_watch, local_pkg_conf], 
	}
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
After removing tsc-esm it was necessary to put tsc on my path  
  
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
To expediate pack ups if you need that ->  
Delete devDependencies & dependencies sections from package.json  
Then fax me @ (yes)-lol-nope & I'll get it right chipper  
```
rm -f node_modules package-lock.json  
npm i --save path tree-kill uuid @types/uuid  
npm i -D typescript @digitak/tsc-esm rimraf typescript @types/node  
// note: path uuid & tree-kill are the external install deps  
```
After above remove ^ and patch from all deps as it is currently for stability     
Thank you if you do this and apologies if I don't see the PR immediately    
I try to not get sticky with package-lock.json, but the dep chain here is light    
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
  
Proofreader eye twitching from a grammars_lol passthrough?  Please open a PR or a google docs speadsheet to explicate my crimes.  
  
Caring is cool.   
<>|WIP Forever|</>  
Nope  
