'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */
var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var fs = require('fs');

//
var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel('mychannel');
var peer = fabric_client.newPeer('grpc://localhost:7051');
channel.addPeer(peer);

//
var member_user = null;
var pre_store_path = path.join(__dirname, 'hfc-key-store');
var store_path = path.resolve(pre_store_path, "../../hfc-key-store");
console.log('Store path:' + store_path);
var tx_id = null;

//
const express = require('express')
const router = express.Router()
const checkLogin = require('../../middlewares/check').checkLogin

var queryStoreTicket = function (storeName) {
    return new Promise(function (resolve, reject) {
        console.log('run queryStoreTicket----------------------------');
        console.log('storeName:' + storeName);
        // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
        Fabric_Client.newDefaultKeyValueStore({
            path: store_path
        }).then((state_store) => {
            console.log(state_store)
            // assign the store to the fabric client
            fabric_client.setStateStore(state_store);
            var crypto_suite = Fabric_Client.newCryptoSuite();
            // use the same location for the state store (where the users' certificate are kept)
            // and the crypto store (where the users' keys are kept)
            var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);

            // get the enrolled user from persistence, this user will sign all requests
            return fabric_client.getUserContext('user1', true);
        }).then((user_from_store) => {
            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Successfully loaded user1 from persistence');
                member_user = user_from_store;
            } else {
                throw new Error('Failed to get user1.... run registerUser.js');
            }
            const request = {
                //targets : --- letting this default to the peers assigned to the channel
                chaincodeId: 'fabcar',
                fcn: 'queryStoreTicket',
                args: [storeName]
            };
            //console.log(sortCar);
            // send the query proposal to the peer
            return channel.queryByChaincode(request);
        }).then((query_responses) => {
            console.log("Query has completed, checking results");
            // query_responses could have more than one  results if there multiple peers were used as targets
            if (query_responses && query_responses.length == 1) {
                if (query_responses[0] instanceof Error) {
                    console.error("error from query = ", query_responses[0]);
                } else {
                    var json = JSON.parse(query_responses[0]); //將json做字串處裡
                    console.log(query_responses[0].toString())
                    var ticketList = [];

                    for (var i = 0; i < json.length; i++) {

                        ticketList.push({
                            Key: json[i].Key,
                            Owner: json[i].Record.Owner,
                            Value: json[i].Record.Value,
                            Licenser: json[i].Record.Licenser,
                            Restaurant: json[i].Record.Restaurant,
                            IssuedDate: json[i].Record.IssuedDate,
                            ExpDate: json[i].Record.ExpDate
                        });
                    }
                    resolve(ticketList);
                    console.log('end queryStoreTicket----------------------------');
                }
            } else {
                console.log("No payloads were returned from query");
            }
        }).catch((err) => {
            console.error('Failed to query successfully :: ' + err);
            reject(err);
        });
    });
}

// GET /queryStoreTicket 
router.get('/', checkLogin, function (req, res, next) {
    const storeName = req.session.store.storeName;
    queryStoreTicket(storeName).then((result) => {
        res.render('store/queryStoreTicket', {
            tickets: result
        })
    })
})
module.exports = router