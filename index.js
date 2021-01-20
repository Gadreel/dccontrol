const inquirer = require('inquirer');
const fuzzy = require('fuzzy');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
inquirer.registerPrompt('datetime', require('inquirer-datepicker-prompt'))
inquirer.registerPrompt("table", require('inquirer-table-prompt'));
inquirer.registerPrompt('file-tree-selection', require('inquirer-file-tree-selection-prompt'));
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'));
inquirer.registerPrompt('dcexpand', require('./lib/inquirer/dcexpand'));

const dcconfig = require("./lib/config");
const dcdeploy = require("./lib/deploy");

const configprofile = process.argv[2] || 'default';

(async () => {
  var config = await dcconfig.loadProfile(configprofile);
  var context = {
    Config: config,
    Inquirer: inquirer
  };

  while (true) {
    console.log('Main Menu');
    console.log();

    await dcconfig.ShowCurrentAccount(context);

    var answers = await inquirer.prompt([ {
      type: 'dcexpand',
      name: 'Choice',
      message: ' ',
      expanded: true,
      choices: [
        { name: 'Exit', value: 0, key: '0' },
        { name: 'Manage Config', value: 8, key: '8' },
        { name: 'Manage Team', value: 9, key: '9' }
      ]
    } ]);

    //console.dir(answers);

    if (answers.Choice == 0)
      break;

    switch (answers.Choice) {
      case 8:
        await dcconfig.cli(context);
        break;

      default:

    }
  }

})();
