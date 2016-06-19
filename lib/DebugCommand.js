'use strict';

const debug = require('debug')('egg-bin:debug');
const childprocess = require('childprocess');
const Command = require('./Command');

class DebugCommand extends Command {
  constructor() {
    super();
    // you can change to your team npm cli
    this.npmCli = 'cnpm';
  }

  * run(cwd, args) {
    args.push('--baseDir');
    args.push(cwd);
    args.push('--cluster');
    args.push('1');

    const eggPath = this.helper.getFrameworkOrEggPath(cwd);
    if (eggPath) {
      args.push(`--eggPath=${eggPath}`);
    }

    const options = {
      env: process.env,
    };

    options.env.NODE_ENV = options.env.NODE_ENV || 'development';
    options.env.EGG_DEBUG = 'true';

    debug('%s %s %j', this.helper.serverBin, args.join(' '), options.env.NODE_ENV);
    yield this.helper.checkDeps();

    // auto download iron-node at the first time
    yield this.helper.getIronNodeBin(this.npmCli, cwd);

    childprocess.inject(function(modulePath, args, opt) {
      // this function will be toString() and save to tmp file
      const cluster = require('cluster');
      const originSetupMaster = cluster.setupMaster;
      cluster.setupMaster = function(settings) {
        if (!settings) return;
        const args = settings.args || [];
        args.unshift(settings.exec);
        settings.args = args;
        settings.exec = require('path').join(process.cwd(), 'node_modules/iron-node/bin/run.js');
        originSetupMaster.call(cluster, settings);
      };
      return [modulePath, args, opt];
    });

    this.helper.forkNode(this.helper.serverBin, args, options);
  }

  help() {
    return '调试模式启动应用';
  }
}

module.exports = DebugCommand;