/**************************************************************************************************************************************/

// GameData may contain the following properties:
//- Environment (Photon Cloud Region, Photon Client AppVersion, Photon AppId, WebhooksVersion, PlayFab TitleId, CloudScriptVersion and Revision, PlayFabServerVersion) 
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
function beforeAddingGameToPlayerList(gameId, gameEntry) {
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

/**************************************************************************************************************************************/