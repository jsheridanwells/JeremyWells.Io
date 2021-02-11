---
layout: post
title: Dockerizing a Mongo database
subheading: Using Docker, we can ensure our database can conveniently grow and change with our application in a local development environment.
published: true
description: Using Docker, we can ensure our database can conveniently grow and change with our application in a local development environment.
tags: 
 - mongo
 - docker 
---

![Vines](/assets/img/docker-mdb/splash.jpg){:class="post-splash"}
###### Photo by [Salomé Guruli](https://unsplash.com/@sguruli?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/vines?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText)

## Introduction
I tend to have about a dozen or so little tech projects loaded onto my machine at any given time - little web app ideas that I work on and stop, an occasional hackathon entry, something I've built working through a tutorial, a few experiments. I've gotten to really enjoy working with MongoDB over the past year and I'll usually add that in as a persistence layer when appropriate. One thing I've realized working off of a local MongoDB development server is all of those databases can accumulate, making it a little scary to experiment with server configurations and deployment setups for one app. Indeed one of the challenges during local development is constantly changing and reconfiguring the database as the project evolves, and safely dropping, rebuilding, and reseeding databases.

One way I've found to add some flexibility to the database layer when developing locally is using Docker to run database server that's dedicated to the project. By leveraging volumes with Docker, we can quickly configure, change, and migrate a database, making it easier to keep database configurations consistent in higher environments. Liekwise, this setup can also simplify creating and tearing down pre-populated databases for automated tests.

In this article, I'll show you a way I've found to set up some Docker configurations and scripts to run a project's MongoDB server in a Docker container. We'll add some configuration files for a local database, then go on to also create a test server with some seeded data.

## Prerequisites
In order to test out the Docker scripts, you'll need [Docker Desktop]() running on your local development machine. If you want to follow along with the sample repo, you'll also need [Node.js]() installed. Lastly, a database browser tool like [MongoDB Compass]() will be helpful for testing and inspecting the databases that we build.

To demonstrate, I've created [a simple MEAN-stack repo]() and I'll show how to add scripts for containerizing the database. However, you could also easily carry out these steps in any other project that uses Mongo - I'll just be going over the Docker setup in this article. The example repo uses Angular, Express, and Typescript, but you don't need to be familiar with any of those to follow along.

I won't be explaining Docker or Mongo commands and concepts, so if you don't have much familiarity with those technologies yet, you should go through a couple of "Getting Started" tutorials before trying this out.

Clone the repo if you're going to use it:
```bash
$ git clone https://github.com/jsheridanwells/MeanUrls.git
$ cd MeanUrls
```

To start with without the Docker setup and follow along, check out the `start` branch and install the dependencies:
```
$ git checkout start
$ npm install
```
Otherwise, the repo shows a working example of what we'll end up by the end of this tutorial.

## The project
This example web app is an extremely simple URL shortener. There are a few npm scripts included to simplify running the project. To get it going:
```bash
$ npm run cp:www
$ npm run dev
```
After the Node and Angular servers spin up, if you navigate to `http://localhost:4200`, you should see 
![A start page for the web application with a form, a button, and an empty results table](/assets/img/docker-mdb/img-1.png){:class="post-img"}
Note that our API server is failing right now because it's not connecting to a running database server. We'll fix that in the next steps. Stop the application for now.

## Environment variables
The first thing we'll need to establish are the various values we'll need to build a MongoDB connection string and the names of the database and collection(s) for the project. The project contains the files `env.sample` with all of the values we'll need for this example:
```
MONGO_INITDB_ROOT_USERNAME=mongo_root
MONGO_INITDB_ROOT_PASSWORD=mongo_root()
APP_USER=app_user
APP_PWD=app_user()
DB_NAME=MeanUrls
DB_COLLECTION_NAME=Urls
MONGO_HOSTNAME=mongodb
MONGO_HOSTNAME_TEST=mongodb_test
MONGO_PORT=28017
```
These are the values that Docker will use to configure the server running in a Docker container. This example uses the following:
 - The root login and password for the database server.
 - An app user and password. These are the credentials the application itself will use to limit its access to just what it needs.
 - The name of the database and the name of a collection to start with.
 - The value `MONGO_HOSTNAME` is the name to access the database server in the Docker container from our host machine. This host name must match the name we give the container service that we'll set up later. We'll use `MONGO_HOSTNAME_TEST` for an alternate test database further on the tutorial.
 - `MONGO_PORT` is the port that our application will use to access the database. MongoDB runs on port `27017` by convention; I change it to `28017` so it doesn't get mixed up with a local instance of Mongo.

Adjust these variables as necessary and then copy them as your actual `.env` file. 
```bash
$ cp .env.sample .env
```
This is the file that we'll use to pass secret keys (e.g., the root password) to the Docker container and to the application. It can also be recreated for configuring secrets in a deployed application. As such, be careful not to check it into any version control.

If you look at the method `buildMongoUrl`in the file `./server/data/mongo.ts` you can see where these values are used to build the Mongo connection string:
```typescript
public static buildMongoUrl(config: MongoDbConfig): string {
    return 'mongodb://'
      + `${ config.appUser }:${ encodeURIComponent(config.appPassword) }`
      + `@${ config.hostName }:${ config.mongoPort }`
      + `/${ config.dbName }`;
```

## Some setup scripts
The official MongoDB image lets us start up the database using either a Javascript file or a Bash script. We'll write some Javascript that will create the app user and the app database 

We'll create some directories to hold our Mongo scripts:
```bash
$ mkdir -p ./scripts/mongo/init
```
And a couple of files:
```bash
$ touch ./scripts/mongo/init/{.dbshell,mongoInit.js}
```
The `.dbshell` file is just a blank placeholder file that's used to create a Linux user to run the scripts in the container. `mongoInit.js` is where we'll create our user and database by pasting the following:
```javascript
// use shell command to save env variable to a temporary file, then return the contents.
// source: https://stackoverflow.com/questions/39444467/how-to-pass-environment-variable-to-mongo-script/60192758#60192758
function getEnvVariable(envVar, defaultValue) {
  var command = run("sh", "-c", `printenv --null ${ envVar } >/tmp/${ envVar }.txt`);
  // note: 'printenv --null' prevents adding line break to value
  if (command != 0) return defaultValue;
  return cat(`/tmp/${ envVar }.txt`)
}

// create application user and collection
var dbUser = getEnvVariable('APP_USER', 'app_user');
var dbPwd = getEnvVariable('APP_PWD', 'app_user()');
var dbName = getEnvVariable('DB_NAME', 'MeanUrls');
var dbCollectionName = getEnvVariable('DB_COLLECTION_NAME', 'Urls');
db = db.getSiblingDB(dbName);
db.createUser({
  'user': dbUser,
  'pwd': dbPwd,
  'roles': [
    {
      'role': 'dbOwner',
      'db': getEnvVariable('DB_NAME', 'MeanUrls')
    }
  ]
});

db.createCollection(dbCollectionName);
```
All of this code is something that could be run in the MongoDB shell, so those native functions are available.

The first function uses the mongo shell `run` command to retrieve environment variables (and I have to credit [this Stack Overflow solution](https://stackoverflow.com/questions/39444467/how-to-pass-environment-variable-to-mongo-script/60192758#60192758) for help).

Then, we create the database with `getSiblingDB`, a user with `createUser`, and a collection with `createCollection`.

Note that this script will only run when the container is initially started and bound to a Docker volume on the host, so there won't be any duplication or collision on subsequent startups.

The next step is optional, but I want to also add some seed data so that I can test out the application right away. We'll create a new directory:
```bash
$ mkdir ./scripts/mongo/seed
```
And we'll download some data that I've already generated for the project using [Mockaroo]().
```bash
$ curl https://raw.githubusercontent.com/jsheridanwells/MeanUrls/main/scripts/mongo/seed/MOCK_DATA.json -o ./scripts/mongo/seed/MOCK_DATA.json
```
And we'll create a bash script that will be available in the container to seed the database if we choose to:
```bash
$ touch ./scripts/mongo/seed/mongo_seed.sh
```
Add these contents to the file:
```bash
#!/bin/bash
if [ -f "/MOCK_DATA.json" ]; then
  FILE="/MOCK_DATA.json"
elif [ -f "./MOCK_DATA.json" ]; then
  FILE="./MOCK_DATA.json"
else
  echo "Mock data file not found. Make sure container has a MOCK_DATA.json file for this script to work"
  exit 1
fi

mongoimport --host $MONGO_HOSTNAME \
  --authenticationDatabase $DB_NAME \
  --username $APP_USER --password $APP_PWD \
  --db $DB_NAME \
  --collection $DB_COLLECTION_NAME \
  --file $FILE --jsonArray
```
This script checks for a `MOCK_DATA.json` file, and if found, runs the `mongoimport` command with the environment settings we created earlier.

# Creating our Mongo service
We've got our keys for creating our database and app user, and scripts to tell Docker how to set them up when creating the container. Now we'll write a `docker-compose.yaml` file to configure and run the Docker container.

Create a `docker-composer.yaml` at the root of the project:
```bash
$ touch ./docker-compose.yaml
```
Now paste the following:
```yaml
version: "3"
services:
  mongodb:
    container_name: mean_urls_db
    image: mongo:latest
    volumes:
      - ./scripts/mongo/init/:/docker-entrypoint-initdb.d
      - ./scripts/mongo/init:/home/mongodb
      - ./scripts/mongo/seed/:/home/mongodb/seed
      - mean_urls_data:/data/db
    ports:
      - "28017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=$MONGO_INITDB_ROOT_USERNAME
      - MONGO_INITDB_ROOT_PASSWORD=$MONGO_INITDB_ROOT_PASSWORD
      - APP_USER=$APP_USER
      - APP_PWD=$APP_PWD
      - DB_NAME=$DB_NAME
      - DB_COLLECTION_NAME=$DB_COLLECTION_NAME
      - MONGO_HOSTNAME=$MONGO_HOSTNAME
volumes:
  mean_urls_data:
```
Here's a walkthrough of what the yaml file is doing:
 - We've named the service `mongodb`. This will become the host name of the MongoDB server and must match `MONGO_HOSTNAME` in the `.env` file.
 - We'll run the official MongoDB image: `image: mongo:latest`.
 - In the `volumes` list there are a few things going on:
 - - We're mounting `./scripts/mongo/init` to a directory on the container called `/docker-entrypoint-initdb.d`. Any javascript or bash scripts in `init` will be run when the container starts up.
 - - We'll also mount `init` to `/home/mongodb` on the container. This creates the Linux user that can run the scripts with the Mongo shell.
 - - The `seed` scripts will be copied over to `/home/mongodb/seed`. That way they're available to seed the database when the container is running if we want.
 - - The last item - `mean_urls_data:/data/db` will bind the Mongo database files as a Docker volume. This allows data to persist when the container is stopped and restarted. It allows lets us easily wipe out all of the Mongo data and start over.
 - Moving on, in `ports`, we're binding our local `28017` port to the conventional Mongo port `27017` on the container.
 - The `environment` list will set all of the environment variables from `.env` to the container.
 - Lastly, `volumes: mean_urls_data` creates the Docker volume on the host machine and must match the last item of the `volumes` list set when defining the `mongodb` service.

## Getting it up and running
It's time to test out the database now.

From the root of the project, use the `docker-compose` command to run the container:
```bash
$ docker-compose up
```
You'll see a mess of entries in your terminal. Once it's settled, check for these lines near the top:
```
Creating network "meanurls_default" with the default driver
Creating volume "meanurls_mean_urls_data" with default driver
Creating mean_urls_db ... done
```
This shows that the network and the volume was created correctly.

Scanning through the logs, check for this entry:
```
mean_urls_db | Successfully added user: {
mean_urls_db |  "user" : "app_user",
mean_urls_db |  "roles" : [
mean_urls_db |          {
mean_urls_db |                  "role" : "dbOwner",
mean_urls_db |                  "db" : "MeanUrls"
mean_urls_db |          }
mean_urls_db |  ]
mean_urls_db | }
```
This helps confirm that `mongoInit.js` was run.

Using the MongoDB Compass, the mongo shell, or your database browser of choice, connect to the database using this connection string:
```
mongodb://app_user:app_user()@localhost:28017/MeanUrls
```
You should see the `MeanUrls` database and the `Urls` collection was created. 

Run the application again - `$ npm run cp:www && npm run dev` and navigate to `http://localhost:4200`. The application should be running in the browser without receving any errors from the API. Lastly, enter a URL to shorten in the application. The object should be saved and everything working as expected:
![A browser view showing the application working as expected](/assets/img/docker-mdb/img-2.png){:class="post-img"}




