const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const exec = require('@actions/exec');
const xml2js = require('xml2js');
const aws = require('aws-sdk');

function parseSuiteResult(suite) {
  const suiteName = suite['$']['name'];
  core.info(`Parsing test results for ${suiteName}...`);
  let nTotal = 0;
  let nPass = 0;
  let nFail = 0;
  let nSkip = 0;
  let nUnknown = 0;
  for (const test of suite['test']) {
    for (const classObj of test['class']) {
      for (const testMethod of classObj['test-method']) {
        nTotal++;
        switch (testMethod['$']['status']) {
          case 'PASS':
            nPass++;
            break;
          case 'FAIL':
            nFail++;
            break;
          case 'SKIP':
            nSkip++;
            break;
          default:
            nUnknown++;
            break;
        }
      }
    }
  }
  const suiteResult = {
    suiteName,
    metrics: [
      {
        name: "Total",
        value: nTotal,
      },
      {
        name: "Passed",
        value: nPass,
      },
      {
        name: "Failed",
        value: nFail,
      },
      {
        name: "Skipped",
        value: nSkip,
      },
      {
        name: "Unknown",
        value: nUnknown,
      },
    ],
  };
  core.info(`Parsed suite result ${JSON.stringify(suiteResult)}`);
  return suiteRes;
}

async function publishSuiteResult(cw, namespace, suiteRes) {
  core.info(`Publishing test results for ${suiteRes.suiteName}...`);
  await cw.putMetricData({
    MetricData: suiteRes.metrics.map(({ name, value }) => {
      return {
        MetricName: name,
        Dimensions: [
          {
            Name: "TestSuite",
            Value: suiteRes.suiteName,
          }
        ],
        Value: value,
        Unit: "Count",
      }
    }),
    Namespace: namespace,
  }).promise();
  core.info(`Published test results for ${suiteRes.suiteName}`);
}

(async () => {
  await exec.exec("pwd");
  await exec.exec("ls");

  const reportsPath = core.getInput('reports-path');
  const namespace = core.getInput('namespace');

  aws.config.update({ region: process.env.AWS_REGION })
  const cw = new aws.CloudWatch();

  core.info("Reading testng results...");
  let xmlRes;
  try {
    const xml = await fs.promises.readFile(path.join(reportsPath, 'testng-results.xml'));
    xmlRes = await xml2js.parseStringPromise(xml);
  } catch (e) {
    core.error(e);
  }

  core.info("Parsing suite results...");
  const suites = xmlRes['testng-results']['suite'];
  const suiteResults = suites.map((suite) => parseSuiteResult(suite));

  core.info("Publishing suite results...");
  try {
    await Promise.all(suiteResults.map((suiteResult) => publishSuiteResult(cw, namespace, suiteResult)));
  } catch (e) {
    core.error(e);
  }
})();