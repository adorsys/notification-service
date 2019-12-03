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

const redisClient = redis.createClient(process.env.REDIS_HOST);
const getAsync = promisify(redisClient.get).bind(redisClient);

/**
 * Configuration from package.json
 */
const pjson = require('./package.json');

const pushService = (function () {
	const connectionsPrefix = `connections_`;

	return {
		/**
		 * Register user in connections. This method must be executed as first in whole registration process.
		 * @param userId id of user.
		 * @param connectionId id of connection.
		 */
		registerUser: async function (userId, connectionId) {
			const userConnections = await handleRedis(this.getUserConnectionLocator(userId), {});
			userConnections[connectionId] = null;
			await handleRedis(this.getUserConnectionLocator(userId), userConnections, true);
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
		registerSocket: async function (userId, connectionId, socket) {
			const userConnections = await handleRedis(this.getUserConnectionLocator(userId), {});
			const fetchedConnection = userConnections[connectionId];

			if (!fetchedConnection) {
				console.log('Not found empty conn for connection ' + connectionId.substring(0, 4) + '*** and  user ' + userId);
				return false;
			}

			socket.userId = userId;
			socket.connectionId = connectionId;
			userConnections[connectionId] = socket;
			await handleRedis(this.getUserConnectionLocator(userId), userConnections, true);
			console.log('Registered socket for connection ' + connectionId.substring(0, 4) + '*** and  user ' + userId);

			return true;
		},
		/**
		 * Remove connection.
		 * @param socket socket to remove.
		 */
		removeConnection: async function (socket) {
			const userId = socket.userId;
			const connectionId = socket.connectionId;

			if (!userId || !connectionId) {
				return;
			}

			const userConnections = await handleRedis(this.getUserConnectionLocator(userId), {});

			if ('undefined' === typeof userConnections[connectionId]) {
				return;
			}

			console.log('Removed socket for user ' + userId + ' and connection: ' + connectionId.substring(0, 4) + '***');
			delete userConnections[connectionId];
			await handleRedis(this.getUserConnectionLocator(userId), userConnections, true);
		},
		/**
		 * Send notification to user.
		 * @param userId id of user.
		 * @param message message.
		 */
		pushMessage: async function (userId, message) {
			const userConnections = await handleRedis(this.getUserConnectionLocator(userId), {});

			for (const connectionId in userConnections) {
				if (!userConnections.hasOwnProperty(connectionId)) {
					continue;

				}

				const socket = userConnections[connectionId];
				socket.emit('message', message);
			}
		},
		/**
		 * @param userId {string}
		 * @returns {string}
		 */
		getUserConnectionLocator(userId) {
			return `${connectionsPrefix}${userId}`;
		}
	}
}());

/**
 * Handle connection to socket.io.
 */
io.on('connection', async function(socket) {
	/**
	 * On registered socket from client.
	 */
	socket.on('register', async function(userId, connectionId) {
		await pushService.registerSocket(userId, connectionId, socket);
	});

	/**
	 * On disconnected socket.
	 */
	socket.on('disconnect',  async function() {
		await pushService.removeConnection(socket);
	});
});

/**
 * Api to register user.
 */
app.put('/api/:userId/register', async function(req, res) {
	const guard = guardRequest(req, res);

	if (!guard) {
		return;
	}

	const { userId } = req.params;
	const { connectionId } = req.query;

	if (!userId || !connectionId) {
		res.status(400).send('Bad Request');
		return;
	}

	await pushService.registerUser(userId, connectionId);
	res.send();
});

/**
 * Api to send message to user.
 */
app.post('/api/:userId/push', async function(req, res) {
	const guard = guardRequest(req, res);

	if (!guard) {
		return;
	}

	const { userId } = req.params;

	if (!userId || !req.body.message) {
        res.status(400).send('Bad Request');
    }

    await pushService.pushMessage(userId, req.body.message);
    res.send();
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

async function handleRedis(redisKey, redisValue = '', forceOverride = false) {
	const fetchedRedisValue = await getAsync(redisKey);

	if (forceOverride || null !== fetchedRedisValue) {
		redisClient.setex(redisKey, 3600, JSON.stringify(redisValue));
	}

	return redisValue;
}

/**
 * @param req
 * @param res
 * @return boolean
 */
function guardRequest(req, res) {
	if (req.header('X-AUTH-TOKEN') !== process.env['AUTH_TOKEN']) {
		res.status(401).send();

		return false;
	}

	return true;
}

http.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

redisClient.on('error', (err) => {
	console.log('\n[REDIS-ERROR]: ', err.message);
});