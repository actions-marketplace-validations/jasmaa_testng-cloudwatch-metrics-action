const fs = require('fs');
const core = require('@actions/core');
const exec = require('@actions/exec');
const aws = require('aws-sdk');

(async () => {

  await exec.exec("pwd");
  await exec.exec("ls");

  try {
    const res = await fs.promises.readFile("./target/surefire-reports/testng-results.xml");
    core.info(res);
  } catch (e) {
    core.error(e);
  }

  // const cw = new aws.CloudWatch();

})();