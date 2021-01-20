const readdirp = require('readdirp');
const path = require('path');
const dcutil = require("./util");
const dcxml = require("./xml");
const fs = require('fs');

class DeploymentRepo {
  constructor(repopath) {
    this._path = repopath;
    this._awsaccountmaps = { };
    this._awsaccounts = [ ];
  }

  set path(v) {
    this._path = v;
  }
  get path() {
    return this._path;
  }

  async discover() {
    var repo = this;

    const files = await readdirp.promise(this._path, {
        depth: 1,
        type: 'directories',
        directoryFilter: [ 'deploy-*' ]
    });

    await Promise.all(files.map(async folder => {
        var fpath = folder.path;
        var dname = fpath.substr(7);
        var dpath = path.join(this._path, fpath);

        var dconfigpath = path.join(dpath, 'config/config.xml');

        try {
            await fs.promises.access(dconfigpath);

            //console.log(dconfigpath + ' - present ');

            var doc = await dcxml.parse_file(dconfigpath);

            var clock = doc.findFirst('Clock');

            if (clock) {
                var clockid = clock.attr('Id');
                var feedid = clock.attr('Feed');
                var keyHex = dcutil.AESCryptoKeyFromParts(clockid, feedid);

                //console.log('Key: ' + keyHex);

                //console.log('IV: ' + ivHex);
                //console.log('Ciphertext: ' + certHex);
                //console.log('Algorithm: ' + getAlgorithm(keyHex));

                var keyring = doc.findFirst('Keyrings');

                if (keyring) {
                    var krpw = keyring.attr('Password');

                    // TODO check if we need to decrypt

                    var decryptedCipherText = dcutil.decryptSetting(krpw, keyHex);

                    //console.log('Decoded krpw Ciphertext: ' + decryptedCipherText);
                }

                var cats = doc.findAll('Catalog');

                for (var i = 0; i < cats.length; i++) {
                    var cat = cats[i];
                    var catid = cat.attr('Id');

                    if (catid == 'Interchange-Aws-Production') {
                        //console.log('     Cat: ' + );

                        var awssetting = cat.findFirst('Settings');

                        if (awssetting) {
                            var awsid = awssetting.attr('KeyId');
                            var awssecret = awssetting.attr('SecretKey');

                            if (! repo._awsaccountmaps[awsid]) {
                                var accnt = {
                                    KeyId: awsid,
                                    SecretKey: awssecret,
                                    Deployments: [ ]
                                };

                                repo._awsaccountmaps[awsid] = accnt;

                                repo._awsaccounts.push(accnt);
                            }

                            repo._awsaccountmaps[awsid].Deployments.push({
                              Title: dname,
                              ComputeRegion: awssetting.attr('ComputeRegion'),
                              StorageRegion: awssetting.attr('StorageRegion') || awssetting.attr('Region')
                            });

                            //console.log('AWS secret: ' + awssecret);
                        }
                    }
                }
            }
        }
        catch (err) {
            console.log(dconfigpath + ' --- error: ' + err);
        }

        return repo;
    }));
  }
}

exports.DeploymentRepo = DeploymentRepo;

exports.discoverRepo = function(repopath) {
  return new DeploymentRepo(repopath);
};
