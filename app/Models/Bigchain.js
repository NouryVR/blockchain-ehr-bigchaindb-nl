'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const driver = require('bigchaindb-driver')
const Env = use('Env')

class Bigchain {

    Bigchain() {
        this.Bigchain_URL = Config.get('BIGCHAIN_URL')
        this.Connection = new driver.Connection(this.Bigchain_URL);
    }

    store(data, metaData, publicKey, privateKey) {
        
    }


    getFiles(publicKey) {

        var con = new driver.Connection('http://localhost:9984/api/v1/');
        try {
            return con.searchAssets(publicKey);
        } catch(error) {
            return error;
        }
    }


}

module.exports = Bigchain
