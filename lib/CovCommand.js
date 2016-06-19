'use strict';

const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const Command = require('./Command');

class CovCommand extends Command {
  constructor() {
    super();
    // you can add ignore dirs here
    this.excludes = [
      'examples/**',
      'mocks_*/**',
    ];
  }

  * run(cwd) {
    process.env.NODE_ENV = 'test';
    process.env.TMPDIR = path.join(cwd, '.tmp');
    mkdirp.sync(process.env.TMPDIR);

    yield this.helper.checkDeps();

    const covFile = require.resolve('istanbul/lib/cli.js');
    const opt = {
      env: process.env,
    };
    const coverageDir = path.join(cwd, 'coverage');
    rimraf.sync(coverageDir);

    // save coverage-xxxx.json to $PWD/coverage
    const covArgs = this.getCovArgs();
    yield this.helper.forkNode(covFile, covArgs, opt);
    rimraf.sync(process.env.TMPDIR);

    // create coverage report
    const reportArgs = this.getReportArgs(coverageDir);
    yield this.helper.forkNode(covFile, reportArgs, opt);
  }

  help() {
    return '统计测试覆盖率';
  }

  addExclude(exclude) {
    this.excludes.push(exclude);
  }

  getCovArgs() {
    let covArgs = [
      'cover',
      '--report', 'none',
      '--print', 'none',
      '--include-pid',
    ];
    for (const exclude of this.excludes) {
      covArgs.push('-x');
      covArgs.push(exclude);
    }
    covArgs = covArgs.concat([
      require.resolve('mocha/bin/_mocha'),
      '--',
      '--timeout', process.env.TEST_TIMEOUT || '200000',
      '--require', require.resolve('thunk-mocha'),
    ]).concat(this.helper.getTestFiles());

    return covArgs;
  }

  getReportArgs(coverageDir) {
    return [
      'report',
      '--root', coverageDir,
      'text-summary',
      'json',
      'lcov',
    ];
  }
}

module.exports = CovCommand;