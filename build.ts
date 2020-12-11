#!/usr/bin/env deno

import * as t from 'https://raw.githubusercontent.com/AZMCode/runtypes/deno/src/index.ts'
import { assert } from 'https://deno.land/std/testing/asserts.ts'


console.log("Prepping Temp Dir");
const tempDir = await Deno.makeTempDir();
console.log(tempDir);
const oldCwd = Deno.cwd();
Deno.chdir(tempDir);
await Deno.mkdir("typescript");

Deno.chdir("./typescript");
console.log("Downloading Typescript Definitions");
const downloadUrl = `https://api.github.com/repos/microsoft/TypeScript/contents/lib?ref=v${Deno.version.typescript}`;
const response = await fetch(downloadUrl,{headers:{"Accept":"application/vnd.github.v3+json"}});
if(!response.ok){
    throw new Error("Could not locate Typescript definitions");
}
const fileNodeTemplate = {
    "name": t.String,
    "path": t.String,
    "sha": t.String,
    "size": t.Number,
    "url": t.String,
    "html_url": t.String,
    "git_url": t.String,
    "download_url": t.String,
    "type": t.Literal("file"),
    "_links": t.Record({
      "self": t.String,
      "git" : t.String,
      "html": t.String
    })
};
const fileNodeType = t.Record(fileNodeTemplate);
const dirNodeType = t.Record({
    ...fileNodeTemplate,
    "size": t.Literal(0),
    "download_url": t.Null,
    "type": t.Literal("dir")
});
const responseType = t.Array(t.Union(fileNodeType,dirNodeType));
const decodedResponse = JSON.parse(await response.text());
assert(responseType.guard(decodedResponse),"Error decoding Github API");
const typedResponse:t.Static<typeof responseType> = decodedResponse;
const libFiles = typedResponse.filter((elm)=>elm.type === "file");
assert(t.Array(fileNodeType).guard(libFiles));
for(const file of libFiles){
    const fileResponse = (await fetch(file.download_url));
    if(!fileResponse.ok){
        throw new Error("Could not download Typescript definitions");
    }
    if(file.name.endsWith(".d.ts")){
        console.log(file.name);
        const fileBody = new Uint8Array(await fileResponse.arrayBuffer());
        Deno.writeFile(file.name,fileBody);
    }
}
console.log("Running io-to-ts");
await Deno.run({cmd: ["npx", "io-to-ts", "--follow-imports", "lib.d.ts"]});
Deno.chdir("../");

//Deno.remove(tempDir,{recursive: true});
Deno.chdir(oldCwd);