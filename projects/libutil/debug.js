const Jasmine = require('jasmine');
const path = require("path");
const fs = require('fs');
const TSNode = require('ts-node/dist');
const TSConfigPaths = require('tsconfig-paths');
const JasmineConsoleReporter = require('jasmine-console-reporter');

TSNode.register({
  project: path.resolve('./tsconfig.json'),
});

const tsconfig = JSON.parse(fs.readFileSync(path.resolve('./tsconfig.json'), 'utf8'));
TSConfigPaths.register({
  baseUrl: './',
  paths: tsconfig.compilerOptions.paths
});

let config = {};
try {
  const configJSON = fs.readFileSync(path.resolve('./jasmine.json'), 'utf8');
  config = JSON.parse(configJSON);
} catch (e) { }

const jasmine = new Jasmine({ projectBaseDir: path.resolve() });
jasmine.addReporter(new JasmineConsoleReporter());

jasmine.loadConfig(config);

jasmine.execute();

console.log('Finished');
