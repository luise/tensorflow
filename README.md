# TensorFlow

This repository contains an example distributed TensorFlow deployment using
Kelda. The TensorFlow application is from
http://henning.kropponline.de/2017/03/19/distributing-tensorflow/.

The example application runs training on the MNIST dataset, and then outputs
the accuracy of the learned model.

## Running the Example Application

1. Install Kelda by following the instructions
[here](http://docs.kelda.io/#getting-started) for _Installing Kelda_,
_Configuring a Cloud Provider_, and _Creating an infrastructure_.

2. Run `npm install .` in this directory to install the dependencies for the
deployment script.

3. Run `kelda run ./main.js` in this directory to start the deployment.

4. Run `kelda show` until the containers are deployed.

At first, the output will only show the machines being booted:
```console
$ kelda show

MACHINE    ROLE      PROVIDER    REGION       SIZE         PUBLIC IP    STATUS
           Master    Amazon      us-west-1    m3.medium                 booting
           Worker    Amazon      us-west-1    m3.medium                 booting
           Worker    Amazon      us-west-1    m3.medium                 booting
           Worker    Amazon      us-west-1    m3.medium                 booting
```

Then, the containers will appear in the output:
```console
$ kelda show

MACHINE         ROLE      PROVIDER    REGION       SIZE         PUBLIC IP        STATUS
sir-7wmie1mk    Master    Amazon      us-west-1    m3.medium    54.215.248.77    connected
sir-5ng8e9ij    Worker    Amazon      us-west-1    m3.medium    13.57.23.179     connected
sir-3stie86j    Worker    Amazon      us-west-1    m3.medium    52.53.223.44     connected
sir-37h8ex8j    Worker    Amazon      us-west-1    m3.medium    54.153.12.188    connected

CONTAINER       MACHINE    COMMAND                              HOSTNAME    STATUS    CREATED    PUBLIC IP
1478efb7b015               keldaio/tensorflow bash -c pyt...    worker2
4cc6c1021f35               keldaio/tensorflow bash -c pyt...    worker
aaa1c610e8ca               keldaio/tensorflow bash -c pyt...    ps
```

_Note, the following outputs will omit the machine information, as they are not
relevant to our use case._

The containers will then be scheduled:
```console
$ kelda show

CONTAINER       MACHINE         COMMAND                              HOSTNAME    STATUS       CREATED    PUBLIC IP
4cc6c1021f35    sir-ggkicgjg    keldaio/tensorflow bash -c pyt...    worker      scheduled

aaa1c610e8ca    sir-jcjgc2jg    keldaio/tensorflow bash -c pyt...    ps          scheduled

1478efb7b015    sir-qtsgfzsj    keldaio/tensorflow bash -c pyt...    worker2     scheduled
```

And then be actually started:
```console
$ kelda show

CONTAINER       MACHINE         COMMAND                              HOSTNAME    STATUS     CREATED          PUBLIC IP
4cc6c1021f35    sir-ggkicgjg    keldaio/tensorflow bash -c pyt...    worker      running    2 minutes ago 

aaa1c610e8ca    sir-jcjgc2jg    keldaio/tensorflow bash -c pyt...    ps          running    2 minutes ago  

1478efb7b015    sir-qtsgfzsj    keldaio/tensorflow bash -c pyt...    worker2     running    2 minutes ago 
```

5. Check out the application output.

First, run `kelda show` (as in step 3) so that we can get a container ID in
order to fetch its logs. Then, copy a container ID for one of the containers
with a `worker` hostname, and run `kelda logs`:
```console
$ kelda logs 4cc6c1021f35
2017-10-25 19:14:53.619794: W tensorflow/core/platform/cpu_feature_guard.cc:45] The TensorFlow library wasn't compiled to use SSE4.1 instructions, but these are available on your machine and could speed up CPU computations.
2017-10-25 19:14:53.619970: W tensorflow/core/platform/cpu_feature_guard.cc:45] The TensorFlow library wasn't compiled to use SSE4.2 instructions, but these are available on your machine and could speed up CPU computations.
2017-10-25 19:14:53.620000: W tensorflow/core/platform/cpu_feature_guard.cc:45] The TensorFlow library wasn't compiled to use AVX instructions, but these are available on your machine and could speed up CPU computations.
2017-10-25 19:14:53.636929: I tensorflow/core/distributed_runtime/rpc/grpc_channel.cc:215] Initialize GrpcChannelCache for job ps -> {0 -> ps.q:2222}
Successfully downloaded train-images-idx3-ubyte.gz 9912422 bytes.
Extracting ./input_data/train-images-idx3-ubyte.gz
Successfully downloaded train-labels-idx1-ubyte.gz 28881 bytes.
Extracting ./input_data/train-labels-idx1-ubyte.gz
Successfully downloaded t10k-images-idx3-ubyte.gz 1648877 bytes.
2017-10-25 19:14:53.637035: I tensorflow/core/distributed_runtime/rpc/grpc_channel.cc:215] Initialize GrpcChannelCache for job worker -> {0 -> localhost:2222, 1 -> worker2.q:2222}
2017-10-25 19:14:53.637847: I tensorflow/core/distributed_runtime/rpc/grpc_server_lib.cc:316] Started server with target: grpc://localhost:2222
2017-10-25 19:14:55.466368: I tensorflow/core/distributed_runtime/master_session.cc:998] Start master session 2a634b60d2a18b27 with config:
Extracting ./input_data/t10k-images-idx3-ubyte.gz
Successfully downloaded t10k-labels-idx1-ubyte.gz 4542 bytes.
Extracting ./input_data/t10k-labels-idx1-ubyte.gz
MNIST accuracy: 0.9004
```

There should be a line in the output starting with "MNIST accuracy". This is
the result of the example TensorFlow application!

## Modifying the TensorFlow application
To change the TensorFlow application, simply edit [main.js](main.js), and
`kelda run ./main.js` again.

In order to deploy a different TensorFlow application, the application should
parse and use the following flags:
- `--job_name`: The job the container should run. Either "ps" or "worker".
- `--task_index`: The index of the container within its job.
- `--ps_hosts`: The addresses of the containers running as a ps job. This should
be used to build the TensorFlow cluster config.
- `--worker_hosts`: The addresses of the containers running as a worker job.
This should be used to build the TensorFlow cluster config.

Applications with external dependencies other than `tensorflow` are currently
not supported.
