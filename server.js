'use strict';



const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const redis = require('redis');
const { promisify } = require('util');
app.set('port', (process.env.PORT || 3000));

app.set('redisHost', (process.env.REDIS_HOST || 'redis'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var Prometheus = require('./util/prometheus');
app.use(Prometheus.requestCounters);
app.use(Prometheus.responseCounters);

const redisClient = redis.createClient(process.env.REDIS_HOST);
const getAsync = promisify(redisClient.get).bind(redisClient);

/**
 * Configuration from package.json
 */
const pjson = require('./package.json');

const pushService = (function () {
	const connections = {};
	return {
		/**
		 * Register user in connections. This method must be executed as first in whole registration process.
		 * @param userId id of user.
		 * @param connectionId id of connection.
		 */
		registerUser: function (userId, connectionId) {
			if (connections[userId] === undefined) {
				connections[userId] = {};
			}

			connections[userId][connectionId] = null;
			console.log('Registered connection ' + connectionId.substring(0, 4) + '*** for user ' + userId);
		},
		/**
		 * Register socket to communication. Must be executed after registerUser.
		 * Modify socket object and set field userId and connectionId.
		 * @param userId id of user.
		 * @param connectionId id of connection.
		 * @param socket socket.
		 * @returns {boolean} if socket was registered or not, if false then you have to do everything again.
		 */
		registerSocket: function (userId, connectionId, socket) {
			if (connections[userId] != null && connections[userId][connectionId] == null) {
				socket.userId = userId;
				socket.connectionId = connectionId;
				connections[userId][connectionId] = socket;
				console.log('Registered socket for connection ' + connectionId.substring(0, 4) + '*** and  user ' + userId);
				return true;
			} else {
				console.log('Not found empty conn for connection ' + connectionId.substring(0, 4) + '*** and  user ' + userId);
				return false;
			}
		},
		/**
		 * Remove connection.
		 * @param socket socket to remove.
		 */
		removeConnection: function (socket) {
			const userId = socket.userId;
			const connectionId = socket.connectionId;
			if (userId && connectionId && connections[userId] && connections[userId][connectionId]) {
				console.log('Removed socket for user ' + userId + ' and connection: ' + connectionId.substring(0, 4) + '***');
				delete connections[socket.connectionId];
			}
		},
		/**
		 * Send notification to user.
		 * @param userId id of user.
		 * @param message message.
		 */
		pushMessage: function (userId, message) {
			const userConnections = connections[userId];
			if (userConnections) {
				for (const connectionId in userConnections) {
					if (userConnections.hasOwnProperty(connectionId)) {
						const socket = userConnections[connectionId];
						if (socket != null) {
							socket.emit('message', message);
						}
					}
				}
			}
		}
	}
}());

/**
 * Handle connection to socket.io.
 */
io.on('connection', function(socket) {
	/**
	 * On registered socket from client.
	 */
	socket.on('register', function(userId, connectionId) {
		pushService.registerSocket(userId, connectionId, socket);
	});

	/**
	 * On disconnected socket.
	 */
	socket.on('disconnect', function() {
		pushService.removeConnection(socket);
	});
});

/**
 * Api to register user.
 */
app.put('/api/:userId/register', function(req, res) {
	if (req.header('X-AUTH-TOKEN') !== process.env['AUTH_TOKEN']) {
		res.status(401).send();
	} else {
		const { userId } = req.params;
		const { connectionId } = req.query;
		if (userId && connectionId) {
			pushService.registerUser(userId, connectionId);
			res.send();
		} else {
			res.status(400).send('Bad Request');
		}
	}
});

/**
 * Api to send message to user.
 */
app.post('/api/:userId/push', function(req, res) {
	if (req.header('X-AUTH-TOKEN') !== process.env['AUTH_TOKEN']) {
		res.status(401).send();
	} else {
		const { userId } = req.params;
		if (userId && req.body.message) {
			pushService.pushMessage(userId, req.body.message);
			res.send();
		}
		else {
			res.status(400).send('Bad Request');
		}
	}
});

/**
 * Ping endpoint.
 */
app.get('/api/status/ping', function(req, res) {
	res.send('pong')
});

/**
 * Info endpoint.
 */
app.get('/api/status/info', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	const info = {
		'name': pjson.name,
		'version': pjson.version
	};
	res.send(info)
});

/**
 * Redis check endpoint
 */
app.get('/api/redis/:redisKey', async function (req, res) {
	res.setHeader('Content-Type', 'application/json');

	const { params, body } = req;
	const { redisKey } = params;

	return res.json(await handleRedis(redisKey, body));
});

/**
 * Redis write endpoint
 */
app.put('/api/redis/:redisKey', async function (req, res) {
	res.setHeader('Content-Type', 'application/json');

	const { params, body } = req;
	const { redisKey } = params;

	return res.json(await handleRedis(redisKey, body, true));
});

async function handleRedis(redisKey, redisValue, override = false) {
	if (override) {
		redisClient.setex(redisKey, 3600, JSON.stringify(redisValue));

		return { source: 'api', data: redisValue };
	}

	const fetchedRedisValue = await getAsync(redisKey);

	return { source: 'cache', data: JSON.parse(fetchedRedisValue)};
}

http.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

redisClient.on('error', (err) => {
	console.log('\n[REDIS-ERROR]: ', err.message);
});

Prometheus.injectMetricsRoute(app);
Prometheus.startCollection();
