var prompt2 = require('prompt-promise');

(async () => {
    console.log('A');

    try {
      var uname = await prompt2('username: ');
      var password = await prompt2.password('password: ');

      console.log('u: ' + uname + ' - p: ' + password);

      prompt2.done();
    }
    catch(x) {
      console.log('error:', x.stack);
      prompt2.finish();
    }

    console.log('C');
})();
