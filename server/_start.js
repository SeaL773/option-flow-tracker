const fs = require('fs');
const Module = require('module');

let code = fs.readFileSync(__dirname + '/index.js', 'utf-8');
code = code.replace(
  "const MONGO_URI = 'mongodb://localhost:27017'",
  "const MONGO_URI = 'mongodb://172.31.16.1:27017'"
);

const m = new Module(__dirname + '/index.js');
m.paths = Module._nodeModulePaths(__dirname);
m.filename = __dirname + '/index.js';
m._compile(code, __dirname + '/index.js');
