const dcxml = require("./lib/xml");
const path = require('path');

(async () => {
    const deploy_repo_path = '../dcserver-internal';
    const fpath = 'deploy-prod-2';

    var dpath = path.join(deploy_repo_path, fpath);

    var dconfigpath = path.join(dpath, 'config/config.xml');

    console.log('A');

    try {
      var result = await dcxml.parse_file(dconfigpath);
      //var result = await dcxml.parse_text('<xml>Hello, <Who Name="world">world</Who>!</xml>');

      console.log('B: ' + JSON.stringify(result,null,'\t'));
    }
    catch (err) {
      console.log('error: ' + err);
    }

    /*
    var result = dcxml.tag('xml')
      .withChildren(
          'Hello again, ',
          dcxml.element('Who')
            .attr('Name', 'world')
            .attr('Germ', 'game')
            .withChildren(
              'world'
            ),
          '!'
      )

    console.log('B: ' + JSON.stringify(result,null,'\t'));
    console.log('B2: ' + result.name);
    console.log('B3: ' + JSON.stringify(result.findFirst('Who'),null,'\t'));
    console.log('B4: ' + JSON.stringify(result.findAll('Who'),null,'\t'));
    console.log('B5: ' + JSON.stringify(result.findAll('who'),null,'\t'));
    console.log('B6: ' + result.findFirst('Who').attr('Name'));
    console.log('B7: ' + result.findFirst('Who').attr('name'));
    console.log('B8: ' + result.findFirst('Who').attr('Germ'));
    */

    console.log('C');
})();
