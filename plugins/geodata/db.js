const nano = require("nano");
let nanoConfig = {};

if (process.env.COUCHDB) {
  const couchdbConfig = JSON.parse(process.env.COUCHDB);
  nanoConfig = {
    url: `https://${couchdbConfig.host}/${couchdbConfig.database}/`,
    requestDefaults: {
      auth: {
        user: couchdbConfig.user,
        pass: couchdbConfig.pass
      }
    }
  };
}

const db = nano(nanoConfig);

function get(id) {
  return new Promise((resolve, reject) => {
    db.find(
      {
        selector: {
          id: { $eq: id }
        }
      },
      (err, res) => {
        if (err) {
          return reject(
            new Error(err.description, { statusCode: err.statusCode })
          );
        }
        return resolve(res);
      }
    );
  });
}

module.exports = {
  db: db,
  get: get
};
