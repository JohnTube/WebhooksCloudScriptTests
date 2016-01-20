/*****************************************************************************************************************************/

// implement your logic into the following callbacks and do not worry about how to load and save Photon room state
// constraints: 
// 1. ONLY update 'data' argument 
// 2. do not delete or overwrite existing properties of 'data' argument

// GameData may contain the following properties:
//- Env (Photon Cloud Region, Photon Client AppVersion, Photon AppId, WebhooksVersion, PlayFab TitleId, CloudScriptVersion and Revision, PlayFabServerVersion) 
//- RoomOptions 
//- Actors (ActorNr: {UserId, Inactive}) 
//- Creation (Timestamp, UserId=creator, Type=Load/Create)
//- JoinEvents (Timestamp, UserId)
//- LeaveEvents (Timestamp, UserId, Inactive, <Reason:Type>)
//- LoadEvents (Timestamp, UserId)
//- SaveEvents (Timestamp, UserId)
//- State (Photon Room State)


// args = PathCreate, Type='Create' webhook args. you need args.GameId.
// data = Room data, modify it but do not delete or overwrite existing properties. this will be saved for you.
function onGameCreated(args, data) {
    'use strict';
}

// args = PathCreate, Type='Load' webhook args. you need args.GameId.
// data = Room data, modify it but do not delete or overwrite existing properties. this will be saved for you.
function onGameLoaded(args, data) {
    'use strict';
}

// args = PathClose, Type='Close' webhook args. you need args.GameId.
// data = Room data. this will be destroyed and lost.
function beforeGameDeletion(args, data) {
    'use strict';
}

// args = PathClose, Type='Save' webhook args. you need args.GameId. args.State is already added to data.
// data = Room data, modify it but do not delete or overwrite existing properties. this will be saved for you.
function beforeSavingGame(args, data) {
    'use strict';
}

// gameId = GameId of the game
// gameEntry = game entry in the list, content vary
function beforeAddingGameToPlayerList(gameId, data) {
    'use strict';
}

// args = PathJoin webhook args. you need args.ActorNr. 
// data = Room data, modify it but do not delete or overwrite existing properties. this will be saved for you.
function onPlayerJoined(args, data) {
    'use strict';
}

// args = PathLeft webhook args. you need args.ActorNr. 
// data = Room data, modify it but do not delete or overwrite existing properties. this will be saved for you.
function onPlayerLeft(args, data) {
    'use strict';
}

// args = PathEvent webhook args, you need args.EvCode and args.Data (event data).
// data = Room data, modify it but do not delete or overwrite existing properties. this will be saved for you.
function onEventReceived(args, data) {
    'use strict';
}

// args = PathGameProperties webhook args, you need args.TargetActor and args.Properties.
// data = Room data, modify it but do not delete or overwrite existing properties. this will be saved for you.
function onPlayerPropertyChanged(args, data) {
    'use strict';
}

// args = PathGameProperties webhook args, you need args.Properties.
// data = Room data, modify it but do not delete or overwrite existing properties. this will be saved for you.
function onRoomPropertyChanged(args, data) {
    'use strict';
}

/*global PhotonException */

// change = {type: <>, loaded: <saved/inGame_Value>, read: <current/received_Value>, timestamp: <>}
// args = webhook args
// data = game data
function onEnvChanged(change, args, data) {
    'use strict';
    switch (change.type) {
    case 'AppId': // should not happen
        throw new PhotonException(101, 'AppId mismatch', change.timestamp, {Change: change, Webhook: args, GameData: data});
    case 'AppVersion': // choose to allow or disallow, tip: you may want to update client or server game data
        // throw new PhotonException(101, 'AppVersion mismatch', change.timestamp, {Change: change, Webhook: args, GameData: data});
        break;
    case 'Region': // choose to allow or disallow, tip:  a "hack" may join players from different regions
        // throw new PhotonException(101, 'Region mismatch', change.timestamp, {Change: change, Webhook: args, GameData: data});
        break;
    case 'WebhooksVersion':
        // throw new PhotonException(101, 'WebhooksVersion mismatch', change.timestamp, {Change: change, Webhook: args, GameData: data});
        break;
    case 'TitleId': // should not happen
        throw new PhotonException(101, 'TitleId mismatch', change.timestamp, {Change: change, Webhook: args, GameData: data});
    case 'CloudScriptVersion': // tip: you may want to update client or server game data
        // throw new PhotonException(101, 'CloudScriptVersion mismatch', change.timestamp, {Change: change, Webhook: args, GameData: data});
        break;
    case 'CloudScriptRevision': // tip: you may want to update client or server game data
        // throw new PhotonException(101, 'CloudScriptRevision mismatch', change.timestamp, {Change: change, Webhook: args, GameData: data});
        break;
    case 'PlayFabServerVersion': // you can safely skip this
        // throw new PhotonException(101, 'PlayFabServerVersion mismatch', change.timestamp, {Change: change, Webhook: args, GameData: data});
        break;
    }
}

/*****************************************************************************************************************************/