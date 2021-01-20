const inquirer = require('inquirer');
const chalkPipe = require('chalk-pipe');
const fuzzy = require('fuzzy');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
inquirer.registerPrompt('datetime', require('inquirer-datepicker-prompt'))
inquirer.registerPrompt("table", require('inquirer-table-prompt'));
inquirer.registerPrompt('file-tree-selection', require('inquirer-file-tree-selection-prompt'));
inquirer.registerPrompt('chalk-pipe', require('inquirer-chalk-pipe'));
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'));

(async () => {
    console.log('A');

    try {
      var answers = await inquirer.prompt([ {
        type: 'fuzzypath',
        name: 'path',
        rootPath: process.cwd()
      } ]);

      console.dir(answers);

      /*
      var answers = await inquirer.prompt([ {
        type: 'input',
        name: 'fav_color',
        message: "What's your favorite color",
        transformer: function(color) {
          return chalkPipe(color)(color);
        }
      } ]);

      console.dir(answers);

      var answers = await inquirer.prompt([ {
          type: 'file-tree-selection',
          name: 'file',
          root: process.cwd()
      } ]);

      console.dir(answers);

      var answers = await inquirer.prompt([ {
        type: "table",
        name: "workoutPlan",
        message: "Choose your workout plan for next week",
        columns: [
          {
            name: "Arms",
            value: "arms"
          },
          {
            name: "Legs",
            value: "legs"
          },
          {
            name: "Cardio",
            value: "cardio"
          },
          {
            name: "None",
            value: undefined
          }
        ],
        rows: [
          {
            name: "Monday",
            value: 0
          },
          {
            name: "Tuesday",
            value: 1
          },
          {
            name: "Wednesday",
            value: 2
          },
          {
            name: "Thursday",
            value: 3
          },
          {
            name: "Friday",
            value: 4
          },
          {
            name: "Saturday",
            value: 5
          },
          {
            name: "Sunday",
            value: 6
          }
        ]
      } ]);

      console.dir(answers);

      var answers = await inquirer.prompt([ {
          type: 'autocomplete',
          name: 'fruit',
          //suggestOnly: true,
          message: 'What is your favorite fruit?',
          //searchText: 'We are searching the internet for you!',
          //emptyText: 'Nothing found!',
          source: searchFood,
          pageSize: 4,
          validate: function (val) {
            return val ? true : 'Type something!';
          },
        },
        {
          type: 'autocomplete',
          name: 'state',
          message: 'Select a state to travel from',
          source: searchStates,
      } ]);

      console.dir(answers);

      var answers = await inquirer.prompt([ {
        type: 'datetime',
        name: 'dt',
        message: 'When would you like a table?',
        initial: new Date('2017-01-01 12:30'),
        // Enter only 1/1 to 3/1
        date: {
          min: "1/1/2017",
          max: "3/1/2017"
        },

        // Enter only 9:00AM to 5:00PM
        time: {
          min: "9:00AM",
          max: "5:00PM",
          minutes: {
            interval: 15
          }
        },
      } ]);

      console.dir(answers);

      var answers = await inquirer.prompt([ {
        type: 'list',
        name: 'Username',
        message: 'What is your username? ',
        choices: [ "Choice A", new inquirer.Separator(), "choice B" ]
      } ]);

      console.dir(answers);

      var answers = await inquirer.prompt([ {
        type: 'checkbox',
        name: 'reptiles',
        message: 'Which reptiles do you love?',
        choices: [
          'Alligators', 'Snakes', 'Turtles', 'Lizards',
        ]
      } ]);

      console.dir(answers);
      */
    }
    catch(x) {
      console.log('error:', x.stack);
    }

    console.log('C');
})();


var states = [
  'Alabama',
  'Alaska',
  'American Samoa',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District Of Columbia',
  'Federated States Of Micronesia',
  'Florida',
  'Georgia',
  'Guam',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Marshall Islands',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Northern Mariana Islands',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Palau',
  'Pennsylvania',
  'Puerto Rico',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virgin Islands',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

var foods = ['Apple', 'Orange', 'Banana', 'Kiwi', 'Lichi', 'Grapefruit'];

function searchStates(answers, input) {
  input = input || '';
  return new Promise(function (resolve) {
    setTimeout(function () {
      var fuzzyResult = fuzzy.filter(input, states);
      const results = fuzzyResult.map(function (el) {
        return el.original;
      });

      results.push(new inquirer.Separator());
      resolve(results);
    }, 10);
  });
}

function searchFood(answers, input) {
  input = input || '';
  return new Promise(function (resolve) {
    setTimeout(function () {
      var fuzzyResult = fuzzy.filter(input, foods);
      resolve(
        fuzzyResult.map(function (el) {
          return el.original;
        })
      );
    }, 10);
  });
}
