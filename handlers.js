/*global handlers */
/*global server */

handlers.Tests = function (args) {
    'use strict';
    try {
        switch (args.Call) {
        case 'CreateSharedGroup':
            return server.CreateSharedGroup({SharedGroupId: args.SharedGroupId});
        case 'UpdateSharedGroupData':
            return server.UpdateSharedGroupData({SharedGroupId: args.SharedGroupId, Data: args.Data});
        case 'DeleteSharedGroup':
            return server.DeleteSharedGroup({SharedGroupId: args.SharedGroupId});
        }
    } catch (e) {
        e.errorType = typeof (e);
        return e;
    }
};