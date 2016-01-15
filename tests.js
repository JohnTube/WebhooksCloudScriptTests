/*global handlers */
/*global server */
/*global http */
/*global log */
/*global script */
/*global currentPlayerId */
/*global beforeAddingGameToPlayerList*/
/*global onGameCreated*/
/*global onGameLoaded*/
/*global beforeGameDeletion*/
/*global beforeSavingGame*/
/*global onPlayerJoined*/
/*global onPlayerLeft*/
/*global onPlayerPropertyChanged*/
/*global onRoomPropertyChanged*/
/*global onEventReceived*/

// http://stackoverflow.com/a/21273362/1449056
function undefinedOrNull(variable) {	'use strict'; return variable === undefined || variable === null; } //return variable == null;

// checks to see if an object has any properties
// Returns true for empty objects and false for non-empty objects
function isEmpty(obj) {
    'use strict';
	// Object.getOwnPropertyNames(obj).length vs. Object.keys(obj).length 
	// http://stackoverflow.com/a/22658584/1449056
	return (undefinedOrNull(obj) || Object.getOwnPropertyNames(obj).length === 0);
}

function isString(obj) {
    'use strict';
    return (typeof obj === 'string' || obj instanceof String);
}

function getISOTimestamp() {
    'use strict';
    try { return (new Date()).toISOString() + Math.random(); } catch (e) { throw e; }
}

function logException(timestamp, data, message) {
    'use strict';
    try {
        //TEMPORARY solution until log functions' output is available from GameManager
        return server.SetTitleData({
            Key: timestamp,
            Value: JSON.stringify({Message: message, Data: data})
        });
    } catch (e) { throw e; }
}

function getGamesListId(playerId) {
    'use strict';
    if (undefinedOrNull(playerId)) {
        playerId = currentPlayerId;
    }
    logException(getISOTimestamp(), playerId, 'getGamesListId');
    return playerId + '_GamesList';
}

function createSharedGroup(id) {
    'use strict';
    try { return server.CreateSharedGroup({SharedGroupId : id});
        } catch (e) { /*logException(getISOTimestamp(), 'createSharedGroup:' + id, String(e.stack));*/ throw e; }
}

function updateSharedGroupData(id, data) {
    'use strict';
    try {
        var key;
        for (key in data) {
            if (data.hasOwnProperty(key) && !undefinedOrNull(data[key]) && !isString(data[key])) {
                data[key] = JSON.stringify(data[key]);
            }
        }
        return server.UpdateSharedGroupData({ SharedGroupId: id, Data: data });
    } catch (e) { logException(getISOTimestamp(), 'updateSharedGroupData(' + id + ', ' + JSON.stringify(data) + ')', String(e.stack)); throw e; }
}

function getSharedGroupData(id, keys) {
    'use strict';
    try {
        var data = {}, key;
        if (undefinedOrNull(keys)) {
            data = server.GetSharedGroupData({ SharedGroupId: id }).Data;
        } else {
            data = server.GetSharedGroupData({ SharedGroupId: id, Keys: keys }).Data;
        }
        for (key in data) {
            if (data.hasOwnProperty(key)) {
                data[key] = JSON.parse(data[key].Value); // 'LastUpdated' and 'Permission' properties are overwritten
            }
        }
        return data;
    } catch (e) { logException(getISOTimestamp(), 'getSharedGroupData:' + id + ',' + JSON.stringify(keys), String(e.stack)); throw e; }
}

function deleteSharedGroup(id) {
    'use strict';
    try { return server.DeleteSharedGroup({SharedGroupId : id}); } catch (e) { logException(getISOTimestamp(), 'deleteSharedGroup:' + id, String(e.stack)); throw e; }
}

function getSharedGroupEntry(id, key) {
    'use strict';
    try { return getSharedGroupData(id, [key])[key]; } catch (e) { logException(getISOTimestamp(), 'getSharedGroupEntry:' + id + ',' + key, String(e.stack)); throw e; }
}

function updateSharedGroupEntry(id, key, value) {
    'use strict';
    try {
        var data = {};
        data[key] = value;
        return updateSharedGroupData(id, data);
    } catch (e) { logException(getISOTimestamp(), 'updateSharedGroupEntry:' + id + ',' + key + ',' + value, String(e.stack)); throw e; }
}

function deleteSharedGroupEntry(id, key) {
    'use strict';
    try { return updateSharedGroupEntry(id, key, null); } catch (e) { logException(getISOTimestamp(), 'deleteSharedGroupEntry:' + id + ',' + key, String(e.stack)); throw e; }
}



function PhotonException(code, msg, timestamp, data) {
    'use strict';
	this.ResultCode = code;
	this.Message = msg;
    this.Timestamp = timestamp;
    this.Data = data;
    logException(timestamp, data, msg);
    //this.Stack = (new Error()).stack;
}

PhotonException.prototype = Object.create(Error.prototype);
PhotonException.prototype.constructor = PhotonException;

var LeaveReason = { ClientDisconnect: '0', ClientTimeoutDisconnect: '1', ManagedDisconnect: '2', ServerDisconnect: '3', TimeoutDisconnect: '4', ConnectTimeout: '5',
                    SwitchRoom: '100', LeaveRequest: '101', PlayerTtlTimedOut: '102', PeerLastTouchTimedout: '103', PluginRequest: '104', PluginFailedJoin: '105' };

function checkWebhookArgs(args, timestamp) {
    'use strict';
	var msg = 'Missing argument: ';
	if (undefinedOrNull(args.AppId)) {
		throw new PhotonException(1, msg + 'AppId', timestamp, args);
	}
	if (undefinedOrNull(args.AppVersion)) {
		throw new PhotonException(1, msg + 'AppVersion', timestamp, args);
	}
	if (undefinedOrNull(args.Region)) {
		throw new PhotonException(1, msg + 'Region', timestamp, args);
	}
	if (undefinedOrNull(args.GameId)) {
		throw new PhotonException(1, msg + 'GameId', timestamp, args);
	}
	if (undefinedOrNull(args.Type)) {
		throw new PhotonException(1, msg + 'Type', timestamp, args);
	}
	if ((args.Type !== 'Close' && args.Type !== 'Save')) {
		if (undefinedOrNull(args.ActorNr)) {
			throw new PhotonException(1, msg + 'ActorNr', timestamp, args);
		}
		if (undefinedOrNull(args.UserId)) {
			throw new PhotonException(1, msg + 'UserId', timestamp, args);
		}
        if (args.UserId !== currentPlayerId) {
            throw new PhotonException(3, 'currentPlayerId=' + currentPlayerId + ' does not match UserId', timestamp, args);
        }
		if (undefinedOrNull(args.Username) && undefinedOrNull(args.Nickname)) {
			throw new PhotonException(1, msg + 'Username/Nickname', timestamp, args);
		}
	} else {
		if (undefinedOrNull(args.ActorCount)) {
            throw new PhotonException(1, msg + 'ActorCount', timestamp, args);
		}
        if (!undefinedOrNull(args.State2) && !undefinedOrNull(args.State2.ActorList)) {
            if (args.State2.ActorList.length !== args.ActorCount) {
                throw new PhotonException(2, 'ActorCount does not match State2.ActorList.count', timestamp, args);
            }
        }
	}
	switch (args.Type) {
    case 'Load':
        if (undefinedOrNull(args.CreateIfNotExists)) {
            throw new PhotonException(1, msg + 'CreateIfNotExists', timestamp, args);
        }
        break;
    case 'Create':
        if (undefinedOrNull(args.CreateOptions)) {
            throw new PhotonException(1, msg + 'CreateOptions', timestamp, args);
        }
        if (args.ActorNr !== 1) {
            throw new PhotonException(2, 'ActorNr != 1 and Type == Create', timestamp, args);
        }
        break;
    case 'Join':
        if (args.ActorNr <= 0) {
            throw new PhotonException(2, 'ActorNr <= 1 and Type == Join', timestamp, args);
        }
        break;
    case 'Player':
        if (undefinedOrNull(args.TargetActor)) {
            throw new PhotonException(1, msg + 'TargetActor', timestamp, args);
        }
        if (undefinedOrNull(args.Properties)) {
            throw new PhotonException(1, msg + 'Properties', timestamp, args);
        }
        if (!undefinedOrNull(args.Username) && undefinedOrNull(args.State)) {
            throw new PhotonException(1, msg + 'State', timestamp, args);
        }
        break;
    case 'Game':
        if (undefinedOrNull(args.Properties)) {
            throw new PhotonException(1, msg + 'Properties', timestamp, args);
        }
        if (!undefinedOrNull(args.Username) && undefinedOrNull(args.State)) {
            throw new PhotonException(1, msg + 'State', timestamp, args);
        }
        break;
    case 'Event':
        if (undefinedOrNull(args.Data)) {
            throw new PhotonException(1, msg + 'Data', timestamp, args);
        }
        if (!undefinedOrNull(args.Username) && undefinedOrNull(args.State)) {
            throw new PhotonException(1, msg + 'State', timestamp, args);
        }
        break;
    case 'Save':
        if (undefinedOrNull(args.State)) {
            throw new PhotonException(1, msg + 'State', timestamp, args);
        }
        if (args.ActorCount <= 0) {
            throw new PhotonException(2, 'ActorCount <= 0 and Type == Save', timestamp, args);
        }
        break;
    case 'Close':
        if (args.ActorCount !== 0) {
            throw new PhotonException(2, 'ActorCount != 0 and Type == Close', timestamp, args);
        }
        break;
    case 'Leave':
        throw new PhotonException(2, 'Deprecated forward plugin webhook!', timestamp, args);
    default:
        if (LeaveReason.hasOwnProperty(args.Type)) {
            if (undefinedOrNull(args.IsInactive)) {
                throw new PhotonException(1, msg + 'IsInactive', timestamp, args);
            }
            if (undefinedOrNull(args.Reason)) {
                throw new PhotonException(1, msg + 'Reason', timestamp, args);
            }
            if (LeaveReason[args.Type] !== args.Reason) { // For some reason Type string does not match Reason code
                throw new PhotonException(2, 'Reason code does not match Leave Type string', timestamp, args);
            }
            if (['1', '100', '103', '105'].indexOf(args.Reason) > -1) { // Unexpected leave reasons
                throw new PhotonException(2, 'Unexpected LeaveReason', timestamp, args);
            }
        } else {
            throw new PhotonException(2, 'Unexpected Type:' + args.Type);
        }
        break;
	}
}


function loadGameData(gameId) {
    'use strict';
    try {
        var listId = getGamesListId(currentPlayerId),
            data = getSharedGroupEntry(listId, gameId);
        if (isEmpty(data)) {
            createSharedGroup(listId);
            return data;
        }
        if (data.Creation.UserId !== currentPlayerId) {
            listId = getGamesListId(data.Creation.UserId);
            data = getSharedGroupEntry(listId, gameId);
        }
        return data;
    } catch (e) { logException(getISOTimestamp(), 'loadGameData:' + gameId + ',currentPlayerId=' + currentPlayerId, String(e.stack)); throw e; }
}

function saveGameData(gameId, data) {
    'use strict';
    try {
        deleteSharedGroup(gameId);
        updateSharedGroupEntry(getGamesListId(data.Creation.UserId), gameId, data);
    } catch (e) { logException(getISOTimestamp(), 'saveGameData:' + gameId + ',' + JSON.stringify(data), String(e.stack)); throw e; }
}

function deleteGameData(gameId, data) {
    'use strict';
    try {
        deleteSharedGroup(gameId);
        deleteSharedGroupEntry(getGamesListId(data.Creation.UserId), gameId);
    } catch (e) { logException(getISOTimestamp(), 'deleteGameData:' + gameId + ',' + JSON.stringify(data), String(e.stack)); throw e; }
}
    
function addGameToList(gameId, data) {
    'use strict';
    try {
        beforeAddingGameToPlayerList(gameId, data);
        updateSharedGroupEntry(getGamesListId(handlers.currentPlayerId), gameId, data);
    } catch (e) { logException(getISOTimestamp(), 'deleteGameData:' + gameId + ',' + JSON.stringify(data), String(e.stack)); throw e; }
}

function createGame(args, timestamp) {
    'use strict';
    try {
        createSharedGroup(args.GameId);
        var data = {};
        data.Env = {Region: args.Region, AppVersion: args.AppVersion, AppId: args.AppId, TitleId: script.titleId,
                    CloudScriptVersion: script.version, CloudScriptRevision: script.revision, PlayFabServerVersion: server.version,
                   WebhooksVersion: undefinedOrNull(args.Nickname) ? '1.0' : '1.2'};
        data.RoomOptions = args.CreateOptions;
        data.Creation = {Timestamp: timestamp, UserId: args.UserId, Type: args.Type};
        data.Actors = {1: {UserId: args.UserId, Inactive: false}};
        data.NextActorNr = 2;
        onGameCreated(args, data);
        updateSharedGroupData(args.GameId, data);
        addGameToList(args.GameId, data);
    } catch (e) { logException(getISOTimestamp(), null, String(e.stack));
        throw new PhotonException(7, 'Error creating new game: ' + args.GameId, timestamp, {Webhook: args}); }
}


handlers.RoomCreated = function (args) {
    'use strict';
    try {
        var timestamp = getISOTimestamp(),
            data = {},
            actorNr;
        checkWebhookArgs(args, timestamp);
        if (args.Type === 'Create') {
            createGame(args, timestamp);
            return {ResultCode: 0, Message: 'OK'};
        } else if (args.Type === 'Load') {
            logException(timestamp, {Webhook: args, currentPlayerId: currentPlayerId}, 'RoomCreated');
            data = loadGameData(args.GameId);
            //logException(timestamp, data, '');
            if (!undefinedOrNull(data.errorCode) || undefinedOrNull(data.State)) {
                if (args.CreateIfNotExists === false) {
                    throw new PhotonException(5, 'Room=' + args.GameId + ' not found', timestamp, {Webhook: args, CustomState: data});
                } else {
                    createGame(args, timestamp);
                    return {ResultCode: 0, Message: 'OK', State: ''}; // TBD: test if State property is required or what can be returned
                }
            }
            if (args.ActorNr === 0) {
                if (data.Env.WebhooksVersion !== '1.2') {
                    throw new PhotonException(3, 'AsyncRejoin behaviour in 1.0', timestamp, {Webhook: args, CustomState: data});
                } else {
                    args.ActorNr = data.NextActorNr;
                    data.NextActorNr = data.NextActorNr + 1;
                    data.Actors[args.ActorNr] = {UserId: args.UserId, Inactive: false};
                }
            } else if (data.RoomOptions.PlayerTTL !== 0 && data.NextActorNr > args.ActorNr) {
                if (args.ActorNr > 0) {
                    if (data.Actors[args.ActorNr].Inactive === false) {
                        throw new PhotonException(2, 'Actor is already joined', timestamp, {Webhook: args, CustomState: data});
                    } else if (data.RoomOptions.CheckUserOnJoin === true && args.UserId !== data.Actors[args.ActorNr].UserId) {
                        throw new PhotonException(2, 'Illegal rejoin with different UserId', timestamp, {Webhook: args, CustomState: data});
                    } else if (args.UserId !== data.Actors[args.ActorNr].UserId) {
                        data.Actors[args.ActorNr].UserId = args.UserId;
                    }
                } else if (data.RoomOptions.CheckUserOnJoin === true) {
                    for (actorNr in data.Actors) {
                        if (data.Actors.hasOwnProperty(actorNr) && data.Actors[actorNr].UserId === currentPlayerId) {
                            if (data.Actors[actorNr].Inactive === false) {
                                throw new PhotonException(2, 'Actor is already joined?!', timestamp, {Webhook: args, CustomState: data});
                            }
                            args.ActorNr = actorNr;
                            break;
                        }
                    }
                    if (args.ActorNr < 0) {
                        throw new PhotonException(3, 'Unexpected ActorNr in weird Load event', timestamp, {Webhook: args, CustomState: data});
                    }
                } else {
                    throw new PhotonException(3, 'Unexpected ActorNr in weird Load event', timestamp, {Webhook: args, CustomState: data});
                }
            } else {
                throw new PhotonException(3, 'Unexpected ActorNr in weird Load event', timestamp, {Webhook: args, CustomState: data});
            }
            data.Actors[args.ActorNr].Inactive = false;
            if (undefinedOrNull(data.LoadEvents)) {
                data.LoadEvents = {};
            }
            data.LoadEvents[timestamp] = {ActorNr: args.ActorNr, UserId: args.UserId};
            try { createSharedGroup(args.GameId); } catch (x) {}
            onGameLoaded(args, data);
            updateSharedGroupData(args.GameId, data);
            return {ResultCode: 0, Message: 'OK', State: JSON.parse(data.State)};
        } else {
            throw new PhotonException(2, 'Wrong PathCreate Type=' + args.Type, timestamp, {Webhook: args});
        }
    } catch (err) {
        if (err instanceof PhotonException) {
            return {ResultCode: err.ResultCode, Message: err.Message};
        }
        return {ResultCode: 100, Message: String(err.stack)};
    }
};

handlers.RoomClosed = function (args) {
    'use strict';
    try {
        var timestamp = getISOTimestamp(),
            data = {};
        checkWebhookArgs(args, timestamp);
        data = getSharedGroupData(args.GameId);
        if (Object.keys(data.Actors).length !== args.ActorCount) {
            throw new PhotonException(6, 'Actors count does not match', timestamp, {Webhook: args, CustomState: data});
        }
        if (!undefinedOrNull(args.State2)) {
            if (undefinedOrNull(args.State2.ActorList)) {
                throw new PhotonException(6, 'State2 does not contain ActorList', timestamp, {Webhook: args, CustomState: data});
            } else if (args.ActorCount !== args.State2.ActorList.length) {
                throw new PhotonException(6, 'Actors count does not match', timestamp, {Webhook: args, CustomState: data});
            }
        } else if (data.Env.WebhooksVersion !== '1.2') {
            throw new PhotonException(1, 'Missing argument State2', timestamp, {Webhook: args, CustomState: data});
        }
        // TODO: compare data.Env with current env
        if (args.Type === 'Close') {
            beforeGameDeletion(args, data);
            deleteGameData(data);
        } else if (args.Type === 'Save') {
            if (undefinedOrNull(data.SaveEvents)) {
                data.SaveEvents = {};
            }
            data.SaveEvents[timestamp] = {ActorCount: args.ActorCount};
            data.State = args.State;
            beforeSavingGame(args, data);
            saveGameData(data);
        } else {
            throw new PhotonException(2, 'Wrong PathClose Type=' + args.Type, timestamp, {Webhook: args, CustomState: data});
        }
        return {ResultCode: 0, Message: 'OK'};
    } catch (e) {
        if (e instanceof PhotonException) {
            return {ResultCode: e.ResultCode, Message: e.Message};
        }
        return {ResultCode: 100, Message: e.name + ': ' + e.message + ' @' + e.stack};
    }
};

handlers.RoomJoined = function (args) {
    'use strict';
    try {
        var timestamp = getISOTimestamp(),
            data = {},
            actorNr;
        checkWebhookArgs(args, timestamp);
        data = getSharedGroupData(args.GameId);
        if (args.Type !== 'Join') {
            throw new PhotonException(2, 'Wrong PathJoin Type=' + args.Type, timestamp, {Webhook: args, CustomState: data});
        }
        // TODO: compare data.Env with current env
        if (data.RoomOptions.PlayerTTL !== 0 && data.NextActorNr > args.ActorNr) { // ActorNr is already claimed, should be a rejoin
            if (data.Actors[args.ActorNr].Inactive === false) {
                throw new PhotonException(2, 'Actor is already joined', timestamp, {Webhook: args, CustomState: data});
            } else if (data.RoomOptions.CheckUserOnJoin === true && args.UserId !== data.Actors[args.ActorNr].UserId) {
                throw new PhotonException(2, 'Illegal rejoin with different UserId', timestamp, {Webhook: args, CustomState: data});
            } else if (args.UserId !== data.Actors[args.ActorNr].UserId) {
                data.Actors[args.ActorNr].UserId = args.UserId;
            }
            data.Actors[args.ActorNr].Inactive = false;
        } else if (data.NextActorNr === args.ActorNr) { // first join
            if (Object.keys(data.Actors).length === args.RoomOptions.MaxPlayers) {
                throw new PhotonException(2, 'Actors overflow', timestamp, {Webhook: args, CustomState: data});
            }
            for (actorNr in data.Actors) {
                if (data.Actors.hasOwnProperty(actorNr) && data.Actors[actorNr].UserId === currentPlayerId) {
                    throw new PhotonException(2, 'UserId is already used', timestamp, {Webhook: args, CustomState: data});
                }
            }
            addGameToList(args.GameId, {Env: data.Env, Creation: data.Creation});
            data.Actors[args.ActorNr] = {UserId: args.UserId, Inactive: false};
            data.NextActorNr = data.NextActorNr + 1;
        } else {
            throw new PhotonException(2, 'Unexpected ActorNr', timestamp, {Webhook: args, CustomState: data});
        }
        if (undefinedOrNull(data.JoinEvents)) {
            data.JoinEvents = {};
        }
        data.JoinEvents[timestamp] = {ActorNr: args.ActorNr, UserId: args.UserId};
        onPlayerJoined(args, data);
        updateSharedGroupData(args.GameId, data);
        return {ResultCode: 0, Message: 'OK'};
    } catch (e) {
        if (e instanceof PhotonException) {
            return {ResultCode: e.ResultCode, Message: e.Message};
        }
        return {ResultCode: 100, Message: e.name + ': ' + e.message + ' @' + String(e.stack)};
    }
};

handlers.RoomLeft = function (args) {
    'use strict';
    try {
        var timestamp = getISOTimestamp(),
            data = {};
        checkWebhookArgs(args, timestamp);
        data = getSharedGroupData(args.GameId);
        if (!LeaveReason.hasOwnProperty(args.Type)) {
            throw new PhotonException(2, 'Wrong PathLeave Type=' + args.Type, timestamp, {Webhook: args, CustomState: data});
        }
        // TODO: compare data.Env with current env
        if (!data.Actors.hasOwnProperty(args.ActorNr)) {
            throw new PhotonException(2, 'No ActorNr inside the room', timestamp, {Webhook: args, CustomState: data});
        }
        if (args.Type !== LeaveReason.PlayerTtlTimedOut && data.Actors[args.ActorNr].Inactive === true) {
            throw new PhotonException(2, 'Inactive actors cant leave', timestamp, {Webhook: args, CustomState: data});
        }
        if (data.Actors[args.ActorNr].UserId !== args.UserId) {
            throw new PhotonException(2, 'Leaving UserId is different from joined', timestamp, {Webhook: args, CustomState: data});
        }
        if (args.IsInactive === true) {
            data.Actors[args.ActorNr].Inactive = true;
        } else if (args.ActorNr !== 1) { // temporary fix
            delete data.Actors[args.ActorNr];
            deleteSharedGroupEntry(getGamesListId(currentPlayerId), args.GameId);
        }
        if (undefinedOrNull(data.LeaveEvents)) {
            data.LeaveEvents = {};
        }
        data.LeaveEvents[timestamp] = {ActorNr: args.ActorNr, UserId: args.UserId, CanRejoin: args.IsInactive, Reason: args.Reason + ':' + args.Type};
        onPlayerLeft(args, data);
        updateSharedGroupData(args.GameId, data);
        return {ResultCode: 0, Message: 'OK'};
    } catch (e) {
        if (e instanceof PhotonException) {
            return {ResultCode: e.ResultCode, Message: e.Message};
        }
        return {ResultCode: 100, Message: e.name + ': ' + e.message + ' @' + String(e.stack)};
    }
};

handlers.RoomPropertyUpdated = function (args) {
    'use strict';
    try {
        var timestamp = getISOTimestamp(),
            data = {};
        checkWebhookArgs(args, timestamp);
        data = getSharedGroupData(args.GameId);
        if (args.Type === 'Player') {
            onPlayerPropertyChanged(args, data);
        } else if (args.Type === 'Game') {
            onRoomPropertyChanged(args, data);
        } else {
            throw new PhotonException(2, 'Wrong PathGameProperties Type=' + args.Type, timestamp, {Webhook: args, CustomState: data});
        }
        if (!undefinedOrNull(args.State)) {
            data.State = args.State;
            updateSharedGroupData(args.GameId, data);
            updateSharedGroupEntry(getGamesListId(data.Creation.UserId), args.GameId, data);
        } else if (data.Env.WebhooksVersion !== '1.2') {
            throw new PhotonException(1, 'Missing argument State', timestamp, {Webhook: args, CustomState: data});
        }
    } catch (e) {
        if (e instanceof PhotonException) {
            return {ResultCode: e.ResultCode, Message: e.Message};
        }
        return {ResultCode: 100, Message: e.name + ': ' + e.message + ' @' + String(e.stack)};
    }
};

handlers.RoomEventRaised = function (args) {
    'use strict';
    try {
        var timestamp = getISOTimestamp(),
            data = {};
        checkWebhookArgs(args, timestamp);
        data = getSharedGroupData(args.GameId);
        if (args.Type !== 'Event') {
            throw new PhotonException(2, 'Wrong PathEvent Type=' + args.Type, timestamp, {Webhook: args, CustomState: data});
        }
        onEventReceived(args, data);
        if (!undefinedOrNull(args.State)) {
            data.State = args.State;
            updateSharedGroupData(args.GameId, data);
            updateSharedGroupEntry(getGamesListId(data.Creation.UserId), args.GameId, data);
        } else if (data.Env.WebhooksVersion !== '1.2') {
            throw new PhotonException(1, 'Missing argument State', timestamp, {Webhook: args, CustomState: data});
        }
        return {ResultCode: 0, Message: 'OK'};
    } catch (e) {
        if (e instanceof PhotonException) {
            return {ResultCode: e.ResultCode, Message: e.Message};
        }
        return {ResultCode: 100, Message: e.name + ': ' + e.message + ' @' + String(e.stack)};
    }
};

function checkWebRpcArgs(args, timestamp) {
    'use strict';
    var msg = 'Missing argument: ';
	if (undefinedOrNull(args.AppId)) {
		throw new PhotonException(1, msg + 'AppId', timestamp, args);
	}
	if (undefinedOrNull(args.AppVersion)) {
		throw new PhotonException(1, msg + 'AppVersion', timestamp, args);
	}
	if (undefinedOrNull(args.Region)) {
		throw new PhotonException(1, msg + 'Region', timestamp, args);
	}
    if (undefinedOrNull(args.UserId)) {
        throw new PhotonException(1, msg + 'UserId', timestamp, args);
    }
}

handlers.onLogin = function (args) {
    'use strict';
    try {
        var timestamp = getISOTimestamp(),
            data = getSharedGroupData(getGamesListId(currentPlayerId));
        if (!undefinedOrNull(data.code)) {
            createSharedGroup(getGamesListId(currentPlayerId));
            return {ResultCode: 0, Data: {}};
        }
        return {ResultCode: 0, Data: data};
        //checkWebRpcArgs(args, timestamp);
    } catch (e) {
        return {ResultCode: 0, Data: {}};
    }
};

handlers.GetRoomData = function (args) {
    'use strict';
    try {
        var timestamp = getISOTimestamp(),
            data = {};
        checkWebRpcArgs(args, timestamp);
        if (undefinedOrNull(args.GameId)) {
            throw new PhotonException(2, 'Missing argument: GameId', timestamp, args);
        }
        data = getSharedGroupData(args.GameId);
        return {ResultCode: 0, Message: 'OK', Data: data};
    } catch (e) {
        if (e instanceof PhotonException) {
            return {ResultCode: e.ResultCode, Message: e.Message};
        }
        return {ResultCode: 100, Message: e.name + ': ' + e.message + ' @' + String(e.stack)};
    }
};

handlers.GetGameList = function (args) {
    'use strict';
    try {
        var timestamp = getISOTimestamp(),
            gameList = {},
            listToLoad = {},
            gameKey = '',
            userKey = '',
            data = {};
        checkWebRpcArgs(args);
        gameList = getSharedGroupData(getGamesListId(currentPlayerId));
        for (gameKey in gameList) {
            if (gameList.hasOwnProperty(gameKey)) {
                if (gameList[gameKey].Creation.UserId === currentPlayerId) {
                    if (!undefinedOrNull(gameList[gameKey].Actors['1']) && gameList[gameKey].Actors['1'].UserId === currentPlayerId) {
                        data[gameKey] = {ActorNr: 1, Properties: gameList[gameKey].State.CustomProperties};
                    }
                } else {
                    data[gameKey] = {ActorNr: gameList[gameKey].ActorNr};
                    if (undefinedOrNull(listToLoad[gameList[gameKey].Creation.UserId])) {
                        listToLoad[gameList[gameKey].Creation.UserId] = [];
                    }
                    listToLoad[gameList[gameKey].Creation.UserId].push(data[gameKey]);
                }
            }
        }
        for (userKey in listToLoad) {
            if (listToLoad.hasOwnProperty(userKey)) {
                gameList = getSharedGroupData(getGamesListId(userKey), listToLoad[userKey]);
                for (gameKey in gameList) {
                    if (gameList.hasOwnProperty(gameKey)) {
                        data[gameKey].Properties = gameList[gameKey].State.CustomProperties;
                    }
                }
            }
        }
        return {ResultCode: 0, Data: data};
    } catch (e) {
        if (e instanceof PhotonException) {
            return {ResultCode: e.ResultCode, Message: e.Message};
        }
        return {ResultCode: 100, Message: e.name + ': ' + e.message + ' @' + String(e.stack)};
    }
};