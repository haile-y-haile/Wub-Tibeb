// Source-level guard for app-authored copy; member content and external providers
// are not machine-translated. Parsing TypeScript avoids fragile source regexes.
import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";

function objectCopy(path,name) {
  const source=ts.createSourceFile(path,fs.readFileSync(path,"utf8"),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let found;
  function visit(node) {
    if(ts.isVariableDeclaration(node)&&node.name.getText(source)===name) found=node.initializer;
    ts.forEachChild(node,visit);
  }
  visit(source);
  while(found&&(ts.isAsExpression(found)||ts.isSatisfiesExpression(found))) found=found.expression;
  assert.ok(found&&ts.isObjectLiteralExpression(found),`Missing copy object ${name}`);
  const entries={};
  for(const prop of found.properties) {
    if(ts.isPropertyAssignment(prop)&&ts.isStringLiteral(prop.initializer))
      entries[prop.name.text]=prop.initializer.text;
  }
  return entries;
}
const root="artifacts/kemis-swap/src/lib/";
const en=objectCopy(root+"i18n.tsx","en"),am=objectCopy(root+"i18n.tsx","am");
assert.deepEqual(Object.keys(am).sort(),Object.keys(en).sort(),"Both language dictionaries must have exactly the same keys");
assert.equal(en.tagline,"Wear. Share. Repeat.");
assert.equal(am.appName,"ውብ ጥበብ");
for(const [name,copy] of [
  ["interface",am],["enums",objectCopy(root+"i18n.tsx","amEnums")],
  ["notifications/errors",objectCopy(root+"localized-copy.ts","amSystem")],
  ["demonstrations",objectCopy(root+"localized-copy.ts","amSamples")],
]) {
  for(const [key,value] of Object.entries(copy)) {
    assert.ok(/[\u1200-\u139f]/u.test(value),`${name}.${key} needs Ethiopic text`);
    assert.ok(!/[a-z]{2,}/i.test(value.replace(/\{\{.*?\}\}/g,"")),`${name}.${key} contains untranslated English: ${value}`);
  }
}
for(const path of ["manifest.webmanifest","manifest-am.webmanifest"]) {
  const m=JSON.parse(fs.readFileSync("artifacts/kemis-swap/public/"+path,"utf8"));
  assert.equal(m.id,"/","Both languages must identify the SAME installable app");
  assert.ok(m.icons.some(icon=>icon.sizes==="192x192"));
  assert.ok(m.icons.some(icon=>icon.sizes==="512x512"));
  if(m.lang==="am") {
    assert.equal(m.name,"ውብ ጥበብ");
    assert.ok(!/[a-z]{2,}/i.test(m.description));
  }
}
const authSource=ts.createSourceFile("clerk-am.ts",fs.readFileSync(root+"clerk-am.ts","utf8"),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
let authStrings=0;
function checkAuth(node) {
  if(ts.isPropertyAssignment(node)&&ts.isStringLiteral(node.initializer)&&node.name.getText(authSource)!=="locale") {
    const value=node.initializer.text.replace(/\{\{.*?\}\}/g,"");
    assert.ok(!/[a-z]{2,}/i.test(value),`Authentication copy contains English: ${value}`);
    assert.ok(/[\u1200-\u139f]/u.test(value),`Authentication copy needs Ethiopic text: ${value}`);
    authStrings++;
  }
  ts.forEachChild(node,checkAuth);
}
checkAuth(authSource);
assert.ok(authStrings>100,"Authentication localization must cover more than headings");
const copyJs=ts.transpileModule(fs.readFileSync(root+"localized-copy.ts","utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const copyRuntime=await import("data:text/javascript;base64,"+Buffer.from(copyJs).toString("base64"));
assert.equal(copyRuntime.systemText("toString","am","ስህተት"),"ስህተት");
assert.equal(copyRuntime.ownCopy({},"constructor"),undefined,"Member text must not resolve inherited Object properties");
console.log(`PASS: ${Object.keys(am).length} paired interface labels, ${authStrings} authentication strings, Amharic system/sample copy, exact English tagline and localized PWA manifests.`);
