# notification-service

In this project we want to implement a notification-service that solves the following problem.

## Problemdescription

In the enterprise environment access to the servers in the enterprise datacenter is protected with a firewall.
The firewall is usually configured to prohibit websocket connections. So when you have a client running outside
of the enterprise datacenter and want a websocket connection you need to fallback on polling or longpolling with
all the drawbacks like performance and bandwith overhead.

## Possible solution

A notification server hosted outside of the enterprise datacenter can provide clients the possibility to
open a private websocket connection. The client is given a webhook that can be used to send notification over the 
websocket connection to the client. The client can pass this webhook url to services running in the enterprise 
datacenter so that they can notify the client by calling the webhook.

## Sequence Diagramm
![Example](http://www.plantuml.com/plantuml/png/LP0nRiCm34LtdOB8tWjqA08KMRlq13BDr8ATJrMaukRsbLeRWIS2N-y_2ZoRn-BrjeJSPkAK8vpUboHjH2C-v1_gwPeuUb9yIhbBwGp2e3zqki2bv99Cw89xAegRm4y7mRDaGJ1IAuPONL5lGyi3qyiRWLv9iu1M6Knv5YTMGBYl3UW8DwI8POK9hScdpawgCzMo_5li3_ckOXvixsm1HMR9BcEm7Lsrp0bVfEZYkcmbj2SJZ5lOHXmV_G-R4FqYZyFhS_rLdATTTswMTkTV "Example")


# Notification-server

Notification-server is a ready to use push notification server supporting multi-session and authentication. It was built using [Node.js](https://nodejs.org) and [Socket.IO](http://socket.io/). The main purpose of notification-server is to provide an **easy**, **stable** and **secure** solution which can be used to send push notifications to a client application.

## Version

1.0.0

## Features

* support for old browsers which do not support WebSockets
* REST JSON API
* authentication to API and push notification channels
* supports multi-session where the same user can be connected to the notification server from many applications and tabs at the same time
* easy to run
* easy to use

## How to run it

### Docker

#### Build the container

```sh
docker build -t notification-server .
```

#### Run the container

```sh
docker run -d -p 3000:3000 \
  --name notification-server \
  -e "AUTH_TOKEN=<secret>" \
  notification-server:latest
```

> IMPORTANT:
> &lt;secret&gt; - has to be changed into a secure token which will be used as an
> authentication token to notification-server API from your backend application.

### Manual installation

* install Node.js and npm
* fetch the git repository

```sh
git clone https://git.adorsys.de/datev/tax/notification-server.git
```

* install app dependencies using npm

```sh
npm install
```

* set env variable with the authentication token - this token will be used to secure access to REST API

```sh
export AUTH_TOKEN=your_secret
```

* run the server

```sh
npm start
```

## Is it working

Open the ```/api/status/info``` page, e.g. ```http//localhost:3000/api/status/info``` and the application should display the name and current version of the server.

## How to use it

We recommend that it is used in the following way but of course it can be modified :)

### Register a client app

![Diagram of register process](doc/images/register.png)

> IMPORTANT:
> each request from your backend to notification-server has to be authenticated by a
> HEADER X-AUTH-TOKEN with the same value as the env variable AUTH_TOKEN of notification-server

1. Client app asks your backend about the connection data of the push notification channel (in most cases it will be executed after a successful authentication)
2. Your backend app generates a random `connectionId` - it should be unique and secure - we recommend UUID
3. Your backend app registers the user in notification-server executing the method:

   ```PUT /api/{userId}/register?connectionId={connectionId} with X-AUTH-TOKEN header```

   > IMPORTANT
   > where userId is the unique id of your user in your application we will use the
   > userId in the future to send one push notification to all clients of this user

4. Your backend app returns `connectionId` and `url` to notification-server to client app
5. Client app connects and authenticates to notification-server (using socket.io lib):

   ```js
   var socket = io.connect(notificationSocketIo.url);
   socket.on('connect', function() {
       socket.emit('register', userId,  notificationSocketIo.connectionId);
   });
   ```

6. Register client apps which are to receive push notifications. Use socket.io to listen to messages with an identifier `message`:

   ```js
   socket.on('message', function(msg) {
        //handle your message
   });
   ```

### Send a push notification

![Diagram of sending push notification](doc/images/send.png)

1. When your backend application wants to send a push notification to a client just execute:

   ```POST /api/{userId}/push with X-AUTH-TOKEN header```
  
   and send the content of the push notification message, format of message {"message": message_json}, e.g.

   ```json
   {
     "message": {
       "title":"Title of message",
       "body": "Body of message",
       "params": {}
     }
   }
   ```

2. Client app will receive a push notification in callback registered in step 6

### Disconnect

1. To stop receiving push notifications your client app has to execute:

   ```js
   socket.emit('disconnect')
   ```

## Security

### Access to api

There is a simple mechanism using `X-AUTH-TOKEN` header to authenticate your application in notification-server. Each request from your backend `e.g. /api/{userId}/register` and `/api/{userId}/push` requires this header. The token has to have the same value as the env variable `AUTH_TOKEN` of notification-server.

### Access to the push notification channel

The first thing a client application has to do after connecting is to register in notification-server. In order to do this it has to use the `connectionId` generated by the backend. Only registered applications will receive push notifications.

## Monitoring

You can execute `GET /api/status/ping` to check if the application is live.

You can execute `GET /api/status/info` to obtain the application's version.
