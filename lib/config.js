const readdirp = require('readdirp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {  v4: uuidv4 } = require('uuid');

const dcutil = require("./util");
const dcxml = require("./xml");
const dcdeploy = require("./deploy");

/*
  {
    IaaSAccounts: [
      {
        Uuid: 'xxxxxxx'
        Type: 'AWS'     // future others
        Title: 'our agency AWS account'
        KeyId: 'abc'
        SecretKey: 'xyz'    // encrypted with controller key
        ControlRegion: 'us-east-1'
      }
    ],
    CurrentIaaSAccount: 'xxxxxxx',
    Repos: [
      {
        Alias: 'dca'
        Title: 'our agency git repo'
        Path: '/projects/agency-reop'
      }
    ],

  }


  StorageRegion: 'us-east-1'
  ComputeRegion: 'us-east-2'

*/

class ControlProfile {
  constructor(profilename) {
    this._name = profilename;
    this._config = null;
    this._key = null;
  }

  set Name(v) {
    this._name = v;
  }
  get Name() {
    return this._name;
  }

  set Settings(v) {
    this._config = v;
  }
  get Settings() {
    return this._config;
  }

  async load() {
    var profile = this;

    try {
      var userpath = dcutil.userPath();

      var appsettingspath = path.join(userpath, '.dccontrol');

      ! fs.existsSync(appsettingspath) && fs.mkdirSync(appsettingspath);

      // key is shared between all profiles, initialize only once

      var keypath = path.join(appsettingspath, 'key');

      try {
        await fs.promises.access(keypath);

        profile._key = await dcutil.read_file(keypath);
      }
      catch(x) {
        // missing key, so create it
        console.log('Creating control settings key.');

        profile._key = crypto.randomBytes(64).toString('hex');

        await dcutil.write_file(keypath, profile._key);
      }

      // load or init settings for this profile

      var settingpath = path.join(appsettingspath, this._name + '.json');

      try {
        await fs.promises.access(settingpath);

        profile._config = JSON.parse(await dcutil.read_file(settingpath));
      }
      catch(x) {
        // missing key, so create it
        console.log('Creating control settings profile for: ' + this._name);

        profile._config = { };

        await dcutil.write_file(settingpath, JSON.stringify(profile._config, null, '\t'));
      }

      //console.dir(profile._config);

      /*
        var doc = await dcxml.parse_file(dconfigpath);

              var decryptedCipherText = dcutil.decryptSetting(krpw, keyHex);
              */
    }
    catch (err) {
      console.log(' --- error: ' + err);

      throw new Error('Unable to load profile.');
    }

    return profile;
  }

  async save() {
    var profile = this;

    try {
      var userpath = dcutil.userPath();

      var appsettingspath = path.join(userpath, '.dccontrol');

      ! fs.existsSync(appsettingspath) && fs.mkdirSync(appsettingspath);

      // load or init settings for this profile

      var settingpath = path.join(appsettingspath, this._name + '.json');

      console.log('saving');
      console.dir(profile._config);

      await dcutil.write_file(settingpath, JSON.stringify(profile._config, null, '\t'));
    }
    catch (err) {
      console.log(' --- error: ' + err);

      throw new Error('Unable to load profile.');
    }

    return profile;
  }

  async findAccount(alias) {
    var profile = this;

    for (var i = 0; i < profile._config.IaaSAccounts.length; i++) {
      var accnt = profile._config.IaaSAccounts[i];

      if ((accnt.Uuid == alias) || (accnt.KeyId == alias))
        return accnt;
    }

    return null;
  }

  async removeAccount(alias) {
    var profile = this;

    for (var i = 0; i < profile._config.IaaSAccounts.length; i++) {
      var accnt = profile._config.IaaSAccounts[i];

      if ((accnt.Uuid == alias) || (accnt.KeyId == alias)) {
        profile._config.IaaSAccounts.splice(i, 1);
        break;
      }
    }
  }

  async findRepo(alias) {
    var profile = this;

    for (var i = 0; i < profile._config.Repos.length; i++) {
      var repo = profile._config.Repos[i];

      if (repo.Alias == alias)
        return repo;
    }

    return null;
  }

  async removeRepo(alias) {
    var profile = this;

    for (var i = 0; i < profile._config.Repos.length; i++) {
      var repo = profile._config.Repos[i];

      if (repo.Alias == alias) {
        profile._config.Repos.splice(i, 1);
        break;
      }
    }
  }
}

exports.ControlProfile = ControlProfile;

exports.loadProfile = async function(repopath) {
  return new ControlProfile(repopath).load();
};

exports.cli = async function(context) {
  while (true) {
    console.log('Manage Config');
    console.log();

    await showCurrentAccount(context);

    var answers = await context.Inquirer.prompt([ {
      type: 'dcexpand',
      name: 'Choice',
      message: ' ',
      expanded: true,
      choices: [
        { name: 'Exit', value: 0, key: '0' },
        { name: 'Switch Accounts', value: 1, key: '1' },
        { name: 'Manage Accounts', value: 2, key: '2' },
        { name: 'Manage Repos', value: 3, key: '3' }
      ]
    } ]);

    //console.dir(answers);

    if (answers.Choice == 0)
      break;

    switch (answers.Choice) {
      case 1:
        await switchAccounts(context);
        break;

      case 2:
        await manageAccounts(context);
        break;

      case 3:
        await manageRepos(context);
        break;

      default:
    }
  }
};

async function showCurrentAccount(context) {
  console.log('Current Account');

  if (context.Config.Settings.CurrentIaaSAccount) {
    var accnt = await context.Config.findAccount(context.Config.Settings.CurrentIaaSAccount);

    if (accnt) {
      console.log('Title:  ' + accnt.Title + ' (' + accnt.Uuid + ')');
      console.log('Type:   ' + accnt.Type);
      console.log('Region: ' + accnt.ControlRegion);

      console.log();
    }
    else {
      console.log('The current account is set but no config was found.');
      console.log();
    }
  }
  else {
    console.log('There is no current account.');
    console.log();
  }
};

exports.ShowCurrentAccount = showCurrentAccount;

async function switchAccounts(context) {
  console.log('Manage Config > Switch Account');

  var uuid = await chooseAccount(context);

  if (uuid) {
    var accnt = await context.Config.findAccount(uuid);

    if (accnt) {
      context.Config.Settings.CurrentIaaSAccount = uuid;

      await context.Config.save();

      console.log("Account Switched");

      console.log('Title:  ' + accnt.Title + ' (' + accnt.Uuid + ')');
      console.log('Type:   ' + accnt.Type);
      console.log('Region: ' + accnt.ControlRegion);

      console.log();
    }
  }
};

async function manageAccounts(context) {
  while (true) {
    console.log('Manage Config > Manage Accounts');
    console.log();

    var answers = await context.Inquirer.prompt([ {
      type: 'dcexpand',
      name: 'Choice',
      message: ' ',
      expanded: true,
      choices: [
        { name: 'Exit', value: 0, key: '0' },
        { name: 'List Accounts', value: 1, key: '1' },
        { name: 'View Account', value: 2, key: '2' },
        { name: 'Add Account', value: 3, key: '3' },
        { name: 'Remove Account', value: 4, key: '4' },
        { name: 'Import Repo', value: 5, key: '5' }
      ]
    } ]);

    //console.dir(answers);

    if (answers.Choice == 0)
      break;

    switch (answers.Choice) {
      case 1:
        console.log('Manage Config > Manage Accounts > List Accounts');
        console.log();

        if (context.Config.Settings.IaaSAccounts) {
          for (var i = 0; i < context.Config.Settings.IaaSAccounts.length; i++) {
            var acnt = context.Config.Settings.IaaSAccounts[i];

            console.log(' - ' + acnt.Title);
          }
        }
        else {
          console.log('No accounts present');
        }

        console.log();

        break;

      case 2:
      console.log('Manage Config > Manage Accounts > View Account');

        var uuid = await chooseAccount(context);

        if (uuid) {
          var accnt = await context.Config.findAccount(uuid);

          if (accnt) {
            console.log("Account Details");

            console.log('Title:  ' + accnt.Title + ' (' + accnt.Uuid + ')');
            console.log('Type:   ' + accnt.Type);
            console.log('Region: ' + accnt.ControlRegion);

            console.log();

            // TODO other details?
          }
        }

        break;

      case 3:
        console.log('Manage Config > Manage Accounts > Add Account');

        var answers2 = await context.Inquirer.prompt([
          {
            type: 'input',
            name: 'Title',
            message: "Title"
          },
          {
            type: 'input',
            name: 'KeyId',
            message: "Key Id"
          },
          {
            type: 'input',
            name: 'SecretKey',
            message: "Secret Key"
          },
          {
            type: 'input',
            name: 'ControlRegion',
            message: "Control Region"
          }
        ]);

        if (answers2.Title && answers2.KeyId && answers2.SecretKey && answers2.ControlRegion) {
          answers2.Type = 'AWS';  // TODO someday support others
          answers2.Uuid = uuidv4();

          if (! context.Config.Settings.IaaSAccounts)
            context.Config.Settings.IaaSAccounts = [ ];

          context.Config.Settings.IaaSAccounts.push(answers2);

          await context.Config.save();

          console.log('Account added');
        }
        else {
          console.log('Skipped');
        }

        break;

      case 4:
        console.log('Manage Config > Manage Accounts > Remove Account');

        var accntalias = await chooseAccount(context);

        await context.Config.removeAccount(accntalias);

        await context.Config.save();

        console.log("Deleted account: " + accntalias);

        break;

      case 5:
        console.log('Manage Config > Manage Accounts > Import Repo');

        var repoalias = await chooseRepo(context);

        if (repoalias) {
          var repo = await context.Config.findRepo(repoalias);

          if (repo) {
            console.log("Repo Selected");

            console.log('Title: ' + repo.Title + ' (' + repo.Alias + ')');
            console.log('Path:  ' + repo.Path);

            console.log();

            var repo = dcdeploy.discoverRepo(repo.Path);

            await repo.discover();

            console.log('Adding AWS Accounts');

            if (! context.Config.Settings.IaaSAccounts)
              context.Config.Settings.IaaSAccounts = [ ];

            for (var i = 0; i < repo._awsaccounts.length; i++) {
                var accnt = repo._awsaccounts[i];

                accnt.Title = 'Import ' + i;
                accnt.Type = 'AWS';  // TODO someday support others
                accnt.Uuid = uuidv4();

                context.Config.Settings.IaaSAccounts.push(accnt);
            }

            await context.Config.save();

            console.log('Accounts added');
          }
        }

        break;

      default:
    }
  }
}

async function manageRepos(context) {
  while (true) {
    console.log('Manage Config > Manage Repos');
    console.log();

    var answers = await context.Inquirer.prompt([ {
      type: 'dcexpand',
      name: 'Choice',
      message: ' ',
      expanded: true,
      choices: [
        { name: 'Exit', value: 0, key: '0' },
        { name: 'List Repos', value: 1, key: '1' },
        { name: 'View Repo', value: 2, key: '2' },
        { name: 'Add Repo', value: 3, key: '3' },
        { name: 'Remove Repo', value: 4, key: '4' }
      ]
    } ]);

    //console.dir(answers);

    if (answers.Choice == 0)
      break;

    switch (answers.Choice) {
      case 1:
        console.log('Manage Config > Manage Repos > List Repos');
        console.log();

        if (context.Config.Settings.Repos) {
          for (var i = 0; i < context.Config.Settings.Repos.length; i++) {
            var repo = context.Config.Settings.Repos[i];

            console.log(' - ' + repo.Title);
            console.log('   ' + repo.Path);
          }
        }
        else {
          console.log('No repos present');
        }

        console.log();

        break;

      case 2:
        console.log('Manage Config > Manage Repos > View Repo');

        var repoalias = await chooseRepo(context);

        if (repoalias) {
          var repo = await context.Config.findRepo(repoalias);

          if (repo) {
            console.log("Repo Details");

            console.log('Title: ' + repo.Title + ' (' + repo.Alias + ')');
            console.log('Path:  ' + repo.Path);

            console.log();

            var repo = dcdeploy.discoverRepo(repo.Path);

            await repo.discover();

            console.log('AWS Accounts');

            for (var i = 0; i < repo._awsaccounts.length; i++) {
                var accnt = repo._awsaccounts[i];

                console.log('AWS key: ' + accnt.KeyId + ' secret: ' + accnt.SecretKey + ' in: ' + accnt.Deployments.map((x) => x.Title).join(', '));
            }

            // TODO other details? git status, and check origin / branch
          }
        }

        // TODO
        //await manageAccounts(context);
        break;

      case 3:
        console.log('Manage Config > Manage Repos > Add Repo');

        var answers2 = await context.Inquirer.prompt([
          {
            type: 'input',
            name: 'Title',
            message: "Title"
          },
          {
            type: 'input',
            name: 'Alias',
            message: "Alias"
          },
          {
            type: 'input',
            name: 'Path',
            message: "Path"
          }
        ]);

        if (answers2.Title && answers2.Alias && answers2.Path) {
          var fgpath = path.join(answers2.Path, 'foreground.sh');

          try {
            await fs.promises.access(fgpath);

            if (! context.Config.Settings.Repos)
              context.Config.Settings.Repos = [ ];

            context.Config.Settings.Repos.push(answers2);

            await context.Config.save();

            console.log('Repo added');
          }
          catch(x) {
            console.log('This does not appear to be a repo path, missing foreground.sh.');
          }
        }
        else {
          console.log('Skipped');
        }

        break;

      case 4:
        console.log('Manage Config > Manage Repos > Remove Repo');

        var repoalias = await chooseRepo(context);

        await context.Config.removeRepo(repoalias);

        await context.Config.save();

        console.log("Deleted repo: " + repoalias);

        break;

      default:
    }
  }
}

async function chooseAccount(context) {
  console.log('Choose Account');
  console.log();

  if (! context.Config.Settings.IaaSAccounts) {
    console.log('No accounts present');
    return null;
  }

  var choicelist = [ { name: 'Exit', value: 0, key: '0' } ];

  for (var i = 0; i < context.Config.Settings.IaaSAccounts.length; i++) {
    var repo = context.Config.Settings.IaaSAccounts[i];

    choicelist.push({ name: repo.Title, value: repo.Uuid, key: (i+1) + "" });
  }

  var answers = await context.Inquirer.prompt([ {
    type: 'dcexpand',
    name: 'Choice',
    message: ' ',
    expanded: true,
    choices: choicelist
  } ]);

  //console.dir(answers);

  if (answers.Choice == 0)
    return null;

  return answers.Choice;
}

async function chooseRepo(context) {
  console.log('Choose Repo');
  console.log();

  if (! context.Config.Settings.Repos) {
    console.log('No repos present');
    return null;
  }

  var choicelist = [ { name: 'Exit', value: 0, key: '0' } ];

  for (var i = 0; i < context.Config.Settings.Repos.length; i++) {
    var repo = context.Config.Settings.Repos[i];

    choicelist.push({ name: repo.Title, value: repo.Alias, key: (i+1) + "" });
  }

  var answers = await context.Inquirer.prompt([ {
    type: 'dcexpand',
    name: 'Choice',
    message: ' ',
    expanded: true,
    choices: choicelist
  } ]);

  //console.dir(answers);

  if (answers.Choice == 0)
    return null;

  return answers.Choice;
}
