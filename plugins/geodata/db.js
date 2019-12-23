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

async function get(id) {
  return await db.find({
    selector: {
      id: { $eq: id }
    }
  });
}

async function insert(doc) {
  const response = await db.insert(doc);
  if (response.ok) {
    return {
      status: "success"
    };
  } else {
    new Error("Not able to save");
  }
}

async function remove(id) {
  const response = await get(id);
  if (response.docs.length >= 1) {
    const doc = response.docs.pop();
    const result = await db.destroy(doc._id, doc._rev);
    if (result.ok) {
      return {
        status: "success"
      };
    }
  } else {
    throw new Error("Not Found");
  }
}

module.exports = {
  db: db,
  get: get,
  insert: insert,
  remove: remove
};
