var prompt = require('prompt');


var getprompt = function(prompt, schema) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof schema !== 'object') {
        reject(TypeError('only object data supported'));
      }

      prompt.get(schema, function (err, result) {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    }
    catch (x) {
      reject(x);
    }
  });
};


(async () => {
    console.log('A');

    try {
      prompt.start();

      var schema = {
        properties: {
          name: {
            pattern: /^[a-zA-Z\s\-]+$/,
            message: 'Name must be only letters, spaces, or dashes',
            required: true
          },
          password: {
            hidden: true
          }
        }
      };

      //
      // Get two properties from the user: email, password
      //
      var result = await getprompt(prompt, schema);

      console.log('Command-line input received:');
      console.log('  name: ' + result.name);
      console.log('  password: ' + result.password);
    }
    catch(x) {
      console.log('error:', x.stack);
    }

    console.log('C');
})();
