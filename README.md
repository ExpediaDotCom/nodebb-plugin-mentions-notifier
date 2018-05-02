# NodeBB Notifier Plugin

## Getting Started

This plugin will post to any endpoint that you can set in the admin panel of your NodeBB forum, whenever a user is mentioned or a new reply is posted to a thread.

## Requirements

To use the plugin locally, the following software need to be installed:

* A version of Node.js at least 4 or greater ([installation/upgrade instructions](https://github.com/nodesource/distributions))
* Redis, version 2.8.9 or greater **or** MongoDB, version 2.6 or greater
* Node Package Manager (npm)
* Nodebb running in your local machine ([installation/upgrade instructions](https://docs.nodebb.org/installing/os))

## Installation

1- Download the mention notifier plugin.

2- From this plugin's root directory:
```
$ npm install
$ npm link
```

3- Go to your nodebb directory, then:
`$ npm link /path/to/nodebb-plugin-mentions-notifier`

4- Start DB server, then start the Nodebb server:
`$ ./nodebb start`

5- Open a browser window, login as admin and navigate to http://localhost:4567/admin/extend/plugins.

6- Activate the nodebb-plugin-mentions-notifier plugin.

7- From your nodebb directory:
```
$ ./nodebb build
$ ./nodebb restart
```

8- Navigate to http://localhost:4567/admin/plugins/notifier and store a valid URL. If there's a token, store it as part of the url.

9- If you mentioned any user in your Nodebb forum or  a notification will be sent
   to the specified end point URL with the following JSON body Keys:
```
{
    "emails": ["test@expedia.com"], // array of all mentioned user's emails or subscriber's to post
    "url": "forum.com/post/34", // forum post URL [domain/post/pid]
    "type": "mention", // notification type [mention or new-reply]
    "topicTitle": "hello world", // topic title
    "messageBody": "@test sup?" // actual html text of message from user
}
```

In NodeBB, a user can be *watching* a thread, so they will get `new-reply` notification. If a user is *not watching* a thread, but is mentioned either in the main topic or a reply, the will get a `mention`. Otherwise, if the user is *ignoring* a thread, then they will not get any notification.

## Running the tests

Mocha, chai and istanbul have been used to write the unit tests.

Please refer to the following links:
[mocha](https://mochajs.org/)
[chai](http://chaijs.com/)
[istanbul](https://github.com/dwyl/learn-istanbul)

In order to run tests, nodebb must be installed as a module via npm link (the package in npm is very old).

1- You must have a `test_database` configured in nodebb's `config.json` file:
```
"test_database": {
        "host": "127.0.0.1",
        "port": "27017",
        "username": "",
        "password": "",
        "database": "test"
}
```

2- Npm link nodebb as a module for the plugin and run the tests. From this plugin's root directory:
```
$ npm link /path/to/NodeBB
$ npm test
```

# Legal
This project is available under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0.html).

Copyright 2018 Expedia Inc.
