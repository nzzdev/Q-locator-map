const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");
const promptly = require("promptly");
const db = require("../db.js");

const datasets = JSON.parse(process.env.DATASETS);

function getGeojsons(geojsonPath) {
  const filenames = fs.readdirSync(geojsonPath);
  const features = filenames.map(filename => {
    const file = path.join(geojsonPath, filename);
    const featureCollection = JSON.parse(fs.readFileSync(file));
    return featureCollection.features[0];
  });
  return features;
}

async function saveGeojson(id, geojson, bearer) {
  try {
    const form = new FormData();
    form.append("file", JSON.stringify(geojson), {
      filename: `${id}.json`,
      contentType: "application/json"
    });
    const formHeaders = form.getHeaders();

    const response = await fetch(`${process.env.Q_SERVER_BASE_URL}/file`, {
      method: "POST",
      body: form,
      headers: {
        ...formHeaders,
        Authorization: bearer
      }
    });
    if (response.ok) {
      const json = await response.json();
      return json.url;
    } else {
      throw Error(response);
    }
  } catch (error) {
    console.log(error);
  }
}

async function saveVersion(id, version, dataset) {
  try {
    const versionNumber = dataset.version ? dataset.version - 1 : -1;
    const response = await db.get(id);
    if (response.docs.length === 0) {
      const doc = {
        id: id,
        versions: [version]
      };
      return await db.insert(doc);
    } else {
      const doc = response.docs.pop();
      if (versionNumber >= 0 && doc.versions[versionNumber]) {
        doc.versions[versionNumber] = version;
      } else {
        doc.versions.push(version);
      }
      return await db.insert(doc);
    }
  } catch (error) {
    console.log(error);
  }
}

async function getBearerToken() {
  if (!process.env.Q_SERVER_AUTH) {
    const password = await promptly.password(
      "Enter your livingdocs password: ",
      {
        replace: "*"
      }
    );

    const response = await fetch(
      `${process.env.Q_SERVER_BASE_URL}/authenticate`,
      {
        method: "POST",
        body: JSON.stringify({
          username: process.env.LD_USERNAME,
          password: password.trim()
        })
      }
    );
    if (response.ok) {
      const body = await response.json();
      return `Bearer ${body.access_token}`;
    } else {
      throw new Error(
        `Error occured while authenticating: (${response.status}) ${response.statusText}`
      );
    }
  } else {
    return `Bearer ${process.env.Q_SERVER_AUTH}`;
  }
}

async function saveGeodata(geojson, dataset, bearer) {
  try {
    const id = geojson.properties[dataset.id];
    if (id) {
      const label =
        geojson.properties[dataset.label] ||
        geojson.properties[dataset.labelFallback];
      const properties = {};
      for (let [key, value] of Object.entries(dataset.properties)) {
        properties[key] = geojson.properties[value];
      }
      geojson.properties = properties;
      const url = await saveGeojson(id, geojson, bearer);
      const version = {
        label: label,
        description: dataset.description,
        validFrom: dataset.validFrom,
        source: {
          url: dataset.source.url,
          label: dataset.source.label
        },
        format: {
          geojson: url
        }
      };
      const response = await saveVersion(id, version, dataset);
      if (response.ok) {
        console.log(`Successfully stored ${id}`);
      } else {
        throw new Error(`${id} couldn't be saved: ${JSON.stringify(response)}`);
      }
    } else {
      throw new Error(`No wikidataid defined for: ${JSON.stringify(geojson)}`);
    }
  } catch (error) {
    console.log(error);
  }
}

async function main() {
  try {
    const bearer = await getBearerToken();
    for (let dataset of datasets) {
      if (!dataset.disable) {
        const geojsonPath = path.join(__dirname, dataset.path);
        let geojsons = getGeojsons(geojsonPath);
        if (dataset.item) {
          geojsons = geojsons.filter(
            geojson => geojson.properties[dataset.id] === dataset.item
          );
        }
        for (let geojson of geojsons) {
          await saveGeodata(geojson, dataset, bearer);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

main();
