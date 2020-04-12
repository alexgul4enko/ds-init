"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.symbol.description");

require("core-js/modules/es.array.concat");

require("core-js/modules/es.array.filter");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.array.includes");

require("core-js/modules/es.array.index-of");

require("core-js/modules/es.array.join");

require("core-js/modules/es.function.name");

require("core-js/modules/es.object.define-properties");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.get-own-property-descriptors");

require("core-js/modules/es.object.keys");

require("core-js/modules/es.regexp.exec");

require("core-js/modules/es.string.includes");

require("core-js/modules/web.dom-collections.for-each");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var shell = require('shelljs');

var chalk = require('chalk');

var fs = require('fs-extra');

var inquirer = require('inquirer');

var path = require('path');

var _require = require('child_process'),
    execSync = _require.execSync;

var readMe = require('./getReadMe');

var rimraf = require('rimraf');

var readline = require('readline');

var pick = require('lodash/pick');

var prompt = inquirer.createPromptModule();
var allQuestions = [{
  type: 'input',
  name: 'repository',
  message: 'Please enter git url'
}, {
  type: 'input',
  name: 'backendUrl',
  message: 'Please enter dev server url'
}, {
  type: 'list',
  name: 'projectType',
  message: 'What is your project type?',
  choices: ['React', 'MPA', 'MPA & REACT']
}];

function hasYarn() {
  try {
    execSync('yarnpkg --version', {
      stdio: 'ignore'
    });
    return true;
  } catch (e) {
    return false;
  }
}

function getConfigs(name) {
  var questions = name ? allQuestions : [{
    type: 'input',
    name: 'name',
    message: 'Please enter project name'
  }].concat(allQuestions);
  return prompt(questions).then(function (userconfigs) {
    if (!name && !userconfigs.name) {
      throw new Error(chalk.red('A project name is required'));
    }

    return userconfigs;
  })["catch"](function (err) {
    return console.log(err);
  });
}

function updatePkg(pkgPath, _ref) {
  var name = _ref.name,
      projectType = _ref.projectType,
      repository = _ref.repository;
  fs.readFile(pkgPath, 'utf-8').then(function (content) {
    var pkg = JSON.parse(content);
    pkg.name = name;
    pkg.version = '1.0.0';
    pkg.description = "".concat(name, " website");
    pkg.contributors = [];
    pkg.bugs = "".concat(repository, "/issues");
    pkg.repository = repository;

    if (projectType === 'MPA') {
      pkg.dependencies = pick(pkg.dependencies, ['@sentry/browser', 'abortcontroller-polyfill', 'bootstrap', 'core-decorators', 'ds-frontend', 'lodash', 'path-to-regexp', 'smoothscroll-polyfill', 'whatwg-fetch']);
    }

    var license = pkg.license,
        newPkg = _objectWithoutProperties(pkg, ["license"]);

    return fs.outputFile(pkgPath, JSON.stringify(newPkg, null, 2))["catch"](function (err) {
      console.log(chalk.red('Failed to update package.json'));
      throw err;
    });
  });
}

function updateReadMe(pkgPath) {
  return fs.outputFile(pkgPath, readMe)["catch"](function (err) {
    console.log(chalk.red('Failed to update README.md'));
    throw err;
  });
}

function updateEnvFile(path, _ref2) {
  var backendUrl = _ref2.backendUrl,
      projectType = _ref2.projectType;
  var readFile = readline.createInterface({
    input: fs.createReadStream(path),
    output: fs.createWriteStream(path + '_'),
    terminal: false
  });
  readFile.on('line', transform);
  readFile.on('close', function () {
    fs.removeSync(path);
    fs.renameSync(path + '_', path);
  });

  function transform(line) {
    if (line.includes('BACKEND_URL') && backendUrl) {
      return this.output.write("BACKEND_URL=".concat(backendUrl, "\n"));
    }

    if (line.includes('SSR=') && (projectType === 'MPA' || projectType === 'MPA & REACT')) {
      return this.output.write("SSR=TRUE\n");
    }

    this.output.write("".concat(line, "\n"));
  }
}

function init(rootDir, siteName) {
  var folderName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'client';
  var useYarn = hasYarn();

  if (!useYarn) {
    throw new Error(chalk.red('Please install yarn'));
  }

  var dest = path.resolve(rootDir, folderName);
  var configs = {
    name: 'website'
  };

  if (fs.existsSync(dest)) {
    throw new Error(chalk.red("Directory already exists at ".concat(dest, " !")));
  }

  getConfigs(siteName).then(function (userconfigs) {
    configs = _objectSpread({}, configs, {}, userconfigs);
    console.log();
    console.log(chalk.cyan('Creating new FE project ...'));
    console.log();
    console.log(chalk.cyan('Cloning git repository'));

    if (shell.exec("git clone --recursive https://github.com/django-stars/frontend-skeleton ".concat(dest), {
      silent: true
    }).code !== 0) {
      throw new Error(chalk.red("Cloning git repo failed!"));
    }

    shell.exec("cd ./".concat(folderName, " && git fetch origin && git checkout next-generation"));
    console.log(chalk.cyan('Cloning git repository finished'));
    return updatePkg(path.join(dest, 'package.json'), configs);
  }).then(function (_) {
    return updateReadMe(path.join(dest, 'README.md'));
  }).then(function (_) {
    return updateEnvFile(path.join(dest, '.env.default'), configs);
  }).then(function (_) {
    fs.removeSync(path.join(dest, 'LICENSE'));
    rimraf.sync(path.join(dest, '.git'));
    fs.removeSync(path.join(dest, 'Resource.md'));
    var pkgManager = 'yarn';
    console.log("Installing dependencies with: ".concat(chalk.cyan(pkgManager)));

    if (configs.projectType === 'MPA') {
      rimraf.sync(path.join(dest, 'src/app/common'));
      rimraf.sync(path.join(dest, 'src/app/layouts'));
      rimraf.sync(path.join(dest, 'src/app/pages'));
      rimraf.sync(path.join(dest, 'src/app/store'));
      fs.removeSync(path.join(dest, 'src/app/App.js'));
      fs.removeSync(path.join(dest, 'src/app/cache.js'));
      fs.removeSync(path.join(dest, 'src/app/index.js'));
      fs.removeSync(path.join(dest, 'src/app/init.js'));
      fs.removeSync(path.join(dest, 'src/app/routes.js'));
    }

    try {
      shell.exec("cd ./".concat(folderName, " && yarn"));
    } catch (err) {
      console.log(chalk.red('Installation failed'));
      throw err;
    }

    console.log();
    var cdpath = path.join(process.cwd(), configs.name) === dest ? configs.name : path.relative(process.cwd(), configs.name);
    console.log();
    console.log("Success! Created ".concat(chalk.cyan(cdpath)));
    console.log('Inside that directory, you can run several commands:');
    console.log();
    console.log(chalk.cyan("  ".concat(pkgManager, " start")));
    console.log('    Starts the development server.');
    console.log();
    console.log(chalk.cyan("  ".concat(pkgManager, " build")));
    console.log('    Bundles the app into static files for production.');
    console.log();
    console.log('We suggest that you begin by typing:');
    console.log();
    console.log(chalk.cyan('  cd'), "./".concat(cdpath));
    console.log("  ".concat(chalk.cyan("".concat(pkgManager, " start"))));
    console.log();
    console.log('Happy codding!');
  });
}

module.exports = init;