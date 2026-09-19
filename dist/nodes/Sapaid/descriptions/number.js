"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberFields = exports.numberOperations = void 0;
const common_1 = require("./common");
exports.numberOperations = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['number'] } },
    options: [
        {
            name: 'Get',
            value: 'get',
            action: 'Get a number',
            description: 'Get one linked number by ID',
        },
        {
            name: 'Get Status',
            value: 'getStatus',
            action: 'Get the connection status of a number',
            description: 'Whether the number is connected, waiting for a QR scan, or disconnected',
        },
        { name: 'List', value: 'list', action: 'List numbers', description: 'List the linked numbers' },
    ],
    default: 'list',
};
exports.numberFields = [
    (0, common_1.idField)('number', ['get', 'getStatus'], 'numberId', 'Number ID', 'The ID of the linked number'),
];
