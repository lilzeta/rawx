import { exec } from "child_process";
const copy = exec(
    `cp ./packaging/package_npm.json dist/package.json && cp ./README.md dist && cp ./license.kind dist`,
    { stdio: "inherit" },
);
copy.once("exit", async (code) => {
    // console.log(code);
    process.exit(code);
});
