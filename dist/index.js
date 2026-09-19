"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SapaidTrigger = exports.Sapaid = exports.SapaidApi = void 0;
// Credentials
var SapaidApi_credentials_1 = require("./credentials/SapaidApi.credentials");
Object.defineProperty(exports, "SapaidApi", { enumerable: true, get: function () { return SapaidApi_credentials_1.SapaidApi; } });
// Nodes
var Sapaid_node_1 = require("./nodes/Sapaid/Sapaid.node");
Object.defineProperty(exports, "Sapaid", { enumerable: true, get: function () { return Sapaid_node_1.Sapaid; } });
var SapaidTrigger_node_1 = require("./nodes/SapaidTrigger/SapaidTrigger.node");
Object.defineProperty(exports, "SapaidTrigger", { enumerable: true, get: function () { return SapaidTrigger_node_1.SapaidTrigger; } });
