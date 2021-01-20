
exports.credentials = function(id, key) {
  return function() {
    return new Promise((resolve, reject) => {
        resolve({ accessKeyId: id, secretAccessKey: key });
    });
  }
};
