// This file is a Kelda blueprint for running a distributed TensorFlow job.
// The blueprint automatically deploys the file named `main.py` in the current
// directory.
// The blueprint assumes that there are two jobs -- "ps", and "worker".

const fs = require('fs');
const kelda = require('kelda');

// The port TensorFlow uses to communicate between nodes.
const tensorflowPort = 2222;

function main() {
  // Edit this variable to configure the application source to be deployed.
  const srcPath = './main.py';

  const src = fs.readFileSync(srcPath, { encoding: 'utf8' });

  const infra = kelda.baseInfrastructure();
  const containers = makeContainers(src, 1, infra.workers.length - 1);
  containers.forEach((c) => {
    c.deploy(infra);
  });
}

/**
 * makeContainers creates the containers that will run the TensorFlow application.
 *
 * @param {string} jobSource - The source code (as text) for the TensorFlow
 *   application that should be deployed.
 * @param {int} nPs - The number of containers to create in the "ps" job.
 * @param {int} nWorker - The number of containers to create in the "worker" job.
 * @returns {kelda.Container[]} Fully configured Kelda containers that when
 *   deployed, will run the given TensorFlow application.
 */
function makeContainers(jobSource, nPs, nWorker) {
  // Create the containers for the ps job.
  const psContainers = makeJobContainers(jobSource, 'ps', nPs);

  // Create the containers for the worker job.
  const workerContainers = makeJobContainers(jobSource, 'worker', nWorker);

  // Let the worker containers fetch the MNIST dataset over HTTPS.
  kelda.allowTraffic(workerContainers, kelda.publicInternet, 443);

  // Setup the ps_hosts and worker_hosts arguments on all containers.
  const allContainers = psContainers.concat(workerContainers);
  const workerHosts = tensorflowHostsString(workerContainers);
  const psHosts = tensorflowHostsString(psContainers);
  allContainers.forEach((c) => {
    c.command.push('--ps_hosts', psHosts, '--worker_hosts', workerHosts);
  });

  // XXX: Modify the container commands so that after the job completes, the
  // container does not exit. This is currently necessary because Kelda doesn't
  // have a concept of one-off jobs.
  allContainers.forEach((c) => {
    // eslint-disable-next-line no-param-reassign
    c.command = ['bash', '-c', `${c.command.join(' ')} && tail -f /dev/null`];
  });

  // Allow the cluster to communicate internally.
  kelda.allowTraffic(allContainers, allContainers, tensorflowPort);

  return allContainers;
}

function makeJobContainers(jobSource, jobName, n) {
  const containers = [];
  for (let i = 0; i < n; i += 1) {
    containers.push(new kelda.Container({
      name: jobName,
      image: 'keldaio/tensorflow',
      command: ['python', '/usr/src/app/main.py',
        '--job_name', jobName, '--task_index', i.toString()],
      filepathToContent: {
        '/usr/src/app/main.py': jobSource,
      },
    }));
  }
  return containers;
}

/**
 * tensorflowHostsString converts the given containers into a string usable
 *   with the ps_hosts and worker_hosts flags.
 *
 * @param {kelda.Container[]} containers - The containers for which to generate
 *   the string.
 * @returns {string}
 */
function tensorflowHostsString(containers) {
  return containers.map(c => `${c.getHostname()}:${tensorflowPort}`).join(',');
}

main();
