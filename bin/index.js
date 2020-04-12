require('core-js/modules/es.symbol');
require('core-js/modules/es.symbol.description');
require('core-js/modules/es.array.concat');
require('core-js/modules/es.array.slice');

var chalk = require('chalk');
var semver = require('semver');
var path = require('path');
var program = require('commander');
var init = require('../lib/init');
var requiredVersion = require('../package.json').engines.node;

console.log(process.version);
if(!semver.satisfies(process.version, requiredVersion)) {
  console.log(chalk.red('\nMinimum node version not met :)') + chalk.yellow('\nYou are using Node '.concat(process.version, ', Requirement: Node ').concat(requiredVersion, '.\n')));
  process.exit(1);
}

function wrapCommand(fn) {
  return function() {
    return fn.apply(void 0, arguments)['catch'](function(err) {
      console.error(chalk.red(err.stack));
      process.exitCode = 1;
    });
  };
}

program.version(require('../package.json').version).usage('<command> [options]');
program.command('init [siteName] [folderName] [rootDir]').description('Initialize website').action(function(siteName, folderName) {
  var rootDir = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '.';
  wrapCommand(init)(path.resolve(rootDir), siteName, folderName);
});
program.arguments('<command>').action(function(cmd) {
  program.outputHelp();
  console.log('  '.concat(chalk.red('\n  Unknown command '.concat(chalk.yellow(cmd), '.'))));
  console.log();
});
program.parse(process.argv);

if(!process.argv.slice(2).length) {
  program.outputHelp();
}
