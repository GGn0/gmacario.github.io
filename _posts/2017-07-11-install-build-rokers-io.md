---
layout: post
title:  "Installing build.rokers.io"
date:   2017-07-11 19:00:00 CET
tags: howto jenkins docker server installation rokers
---
<!-- markdown-link-check-disable -->

This blog post details the steps I made to install the [build.rokers.io](https://build.rokers.io/) server on [AWS](https://aws.amazon.com/) using [Docker](https://www.docker.com/) and [easy-jenkins](https://github.com/gmacario/easy-jenkins).

### Prepare the AWS instance

<!-- 2017-06-30 18:00 CEST -->

Login to https://aws.amazon.com/ console using your credentials

* Create a `.pem` to connect to VM `build.rokers.io` and slaves
* Create EC2 instance for `build.rokers.io`
  - AWS EC2 c4.2xlarge (8 vCPUs, 15 GiB Memory, Instance Storage: 8 GB)
  - Add EBS 300 GB (to be mounted as `/var`)
* Configure firewall on `build.rokers.io`
  - Open incoming ports 22/tcp, 80/tcp, 443/tcp
* Create EBS volume for secondary volume `/var`
* Register DNS `build.rokers.io`

Connect to AWS instance via SSH:

```
ssh -i ~/.ssh/rokers_genivi_dev.pem ubuntu@build.rokers.io
```

Type the following commands to inspect the HW/SW configuration of the master node:

```
cat /proc/cpuinfo
cat /proc/meminfo
df -h
sudo fdisk -l
cat /etc/os-release
```

Verify that the following requisites are met:

* CPU: 8 cores
* RAM: 16 GB
* Root Volume: 8 GB
* One additional 300 GB volume
* OS: Ubuntu 16.04.2 LTS 64-bit


### Prepare the guest OS on build.rokers.io

Logged as ubuntu@build.rokers.io and make sure that the guest OS is up-to-date

```
sudo apt update && sudo apt dist-upgrade
```

Now install a few additional Ubuntu packages that will be needed to operate the server:

```
sudo apt install byobu git htop mc
```

Login as root

```
sudo -i
```

Logged as root@build.rokers.io, format the secondary volume and mount it as `/var`

**NOTE**: You may need to stop a few services before being able to rename `/var`

```
fdisk /dev/xvdf
mkfs.ext4 -L var /dev/xvdf1
mv /var /var.OLD
echo 'LABEL=var    /var/lib/docker  ext4    defaults       0 1' >>/etc/fstab
mount -a
cd /var.OLD && cp -av . /var
```

Create Swap Space

```
dd if=/dev/zero of=/var/swapfile.dat bs=1M count=16384
mkswap /var/swapfile.dat
chmod 600 /var/swapfile.dat
echo '/var/swapfile.dat    swap    swap    defaults    0    0' >>/etc/fstab
swapon -a
```

Reboot to make sure all the changes are applied


### Install Docker and docker-compose

Logged as ubuntu@build.rokers.io, install Docker

```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
apt-cache policy docker-ce
sudo apt-get install -y docker-ce
sudo systemctl status docker
```

Logged as ubuntu@build.rokers.io, allow user `ubuntu` to run docker without sudo

```
sudo usermod -aG docker ${USER}
```

Logout and log to apply the changes

Logged as ubuntu@build.rokers.io, install docker-compose

```
mkdir -p ~/Downloads && cd ~/Downloads
curl -L https://github.com/docker/compose/releases/download/1.14.0/docker-compose-`uname -s`-`uname -m` >docker-compose
sudo install -m755 docker-compose /usr/local/bin/
docker-compose --version
```


### Install easy-jenkins

Logged as ubuntu@build.rokers.io, install and run easy-jenkins

```
mkdir -p ~/github/gmacario && cd ~/github/gmacario
[ ! -e easy-jenkins ] && git clone https://github.com/gmacario/easy-jenkins
cd ~/github/gmacario/easy-jenkins && git pull --all --prune
./runme.sh
```

Result:

```shell
ubuntu@ip-172-31-26-128:~/github/gmacario/easy-jenkins$ ./runme.sh
WARNING: Cannot find docker-machine - assuming environment variables are already defined
Building myjenkins
Step 1/13 : FROM jenkins:2.60.1
...
Successfully tagged easyjenkins_myjenkins:latest
WARNING: Image for service myjenkins was built because it did not already exist. To rebuild this image you must use `docker-compose build` or `docker-compose up --build`.
Creating easyjenkins_myjenkins_1 ...
Creating easyjenkins_myjenkins_1 ... done
INFO: Initial administrator password: 74eb700cb15d4ce99cc47a60dd694f2d
ubuntu@ip-172-31-26-128:~/github/gmacario/easy-jenkins$
```


### Expose Jenkins through https

<!-- 2017-07-04 06:30 CEST -->

Logged as ubuntu@build.rokers.io, clone the following gist

```shell
mkdir -p ~/gist.github.com/gmacario && cd ~/gist.github.com/gmacario
[ ! -e https-build-rokers-io ] && git clone \
    https://gist.github.com/gmacario/2c11a927bfb9fa33326bd20fe28a85c7 \
    https-build-rokers-io
cd ~/gist.github.com/gmacario/https-build-rokers-io && git pull --all --prune
docker-compose up -d
```

**TODO**: Integrate gist into easy-jenkins

The Jenkins dashboard should be now be accessible as <https://build.rokers.io/>.

#### Alternative: Tunnel through SSH

Since port 9080/tcp on build.rokers.io is firewalled, type the following commands on your laptop to create a SSH tunnel to <http://build.rokers.io:9080/>

```shell
ssh \
    -i ~/.ssh/rokers_genivi_dev.pem \
    -L 29080:localhost:9080 \
    ubuntu@build.rokers.io
```

You will then be able to access the Jenkins dashboard as <http://localhost:29080/>.

**NOTE**: Although SSH tunnel may be sufficient for most of the use-cases, in order to use GitHub based authentication you need to expose the Jenkins Dashboard through https as explained in the section above.


### Complete setup of Jenkins

Now browse `${JENKINS_URL}` (<https://build.rokers.io/> or <http://localhost:29080/> if the SSH tunnel was used instead) and complete the configuration of easy-jenkins:

* Paste the initial admin password (you should find it displayed on the terminal where you launched `./runme.sh`)
* Click **Install suggested plugins**
* Create First Admin User, then click **Save and Finish**
* If requested, click **Restart** to restart Jenkins

Reload the page in the browser, then login to Jenkins as user `admin` using the credentials you have created just before.

* Click on **Build Executor Status**
* Configure node `master`
  - Number of executors: `4` (was 2)
  - Labels: `docker`
  - Click **Save**

Browse `${JENKINS_URL}` > Manage Jenkins > Configure System

* Jenkins Location
  - Jenkins URL: <https://build.rokers.io/>
  - System Admin e-mail address: (fill in the administrative email provided during the creation of Jenkins user `admin`)

* GitHub Pull Requests
  - Jenkins URL: <https://build.rokers.io/>

**TODO**: Configure mail server used by Jenkins - see <http://www.360logica.com/blog/email-notification-in-jenkins/>


### Configure login to Jenkins using GitHub credentials

<!-- 2017-07-06 14:00 CEST -->

Prerequisites: Jenkins Dashboard available as <https://build.rokers.io/>

Follow instructions at <https://github.com/gmacario/easy-jenkins/blob/master/docs/configuring-access-control-via-github.md>

Visit <https://github.com/settings/applications/new> to create a GitHub application registration:

* Application name: `build.rokers.io`
* Homepage URL: `https://build.rokers.io`
* Application description: `TODO`
* Authorization callback URL: `https://build.rokers.io/securityRealm/finishLogin`

then click **Register application**

Keep the result page open, and take note of the following values (they will be used to configure the Github Authentication Plugin as explained in the following section)

* Client ID: xxx
* Client Secret: yyy

Browse `${JENKINS_URL}` > Manage Jenkins > Configure Global Security

* Enable security: Yes
  * TCP port for JNLP agents: Fixed: 50000
  * Disable remember me: No
  * Access Control
    - Security Realm: Github Authentication Plugin
      - Global GitHub OAuth Settings
        - GitHub Web URI: `https://github.com`
        - GitHub API URI: `https://api.github.com`
        - Client ID: xxx (paste the value from the GitHub page above)
        - Client Secret: yyy (paste the value from the GitHub page above)
        - OAuth Scope(s): `read:org,user:email`
    - Authorization: Logged-in users can do anything (See NOTE below)
      * Allow anonymous read access: No
* Markup Formatter: Plain text
* Prevent Cross Site Request Forgery exploits: Yes
* Plugin Manager
  * Use browser for metadata download: No
* Hidden security warnings
  * Enable Slave->Master Access Control: Yes

then click **Save**.

**NOTE**: In order to achieve a finer grain of access control choose instead

* Authorization: Project-based Matrix Authorization Strategy

then add each single GitHub user/group you want to enable.

**IMPORTANT**: Make sure you give all rights at least to one legitimate user, otherwise after clicking "Save" you will not be able to login any more!

Browse `${JENKINS_URL}` > Manage Jenkins > Configure Global Security > Security Realm


### Build rokers-image-base

<!-- 2017-07-11 14:10 CEST -->

Create pipeline for building `rokers-image-base` from sources:

* Click **Open Blue Ocean**
* Click **Create a new Pipeline**
* Where do you store the code? **Github**
* Paste your Github access token, then click **Connect**
* Which organization does the repository belong to? **robotrokers** (if you are not a member of "robotrokers", choose the organization where your forked project `robotrokers/rokers-yocto-distro`)
* Create a single Pipeline or discover all Pipelines? **New Pipeline**
* Choose a repository: **rokers-yocto-distro**, then click **Create Pipeline**

Result: Build SUCCESS (NOTE: It will take about 1h for a scratch build)

To inspect and/or download the generated artifacts:

* Click **Open Blue Ocean**
* Select Pipeline "robotrokers / rokers-yocto-distro"
* Select Branch "dev-rokers"
* Click **Artifacts**

<!-- markdown-link-check-enable -->
<!-- EOF -->
