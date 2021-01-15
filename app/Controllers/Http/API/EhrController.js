const Bigchain = require("../../../Models/Bigchain")
const driver = require('bigchaindb-driver')
const CryptoJS = require("crypto-js");
const { get } = require("@adonisjs/framework/src/Route/Manager");
const Config = use("Env");

class EhrController {

    async index({ params }) {
        
        const con = new driver.Connection("http://localhost:9984/api/v1/");
        var filess = con.searchMetadata(params.public_key).then(files => {

            var decryptedFiles = []
            
            for(var key in files) {
                
                //return files[key]["metadata"];
                if(files[key]["metadata"]["patient"] !== undefined && files[key]["metadata"]["patient"] == params.public_key) {
                    //return 'koekje';
                    var getFiles = con.getTransaction(files[key]["id"]).then(results => {
                        var document = results["asset"]["data"]["document"];
                        var res = {
                            'id': results["id"],
                            'document': {
                                "title": this.decrypt(document["title"]),
                                "path": this.decrypt(document["path"]),
                                "tags": document["tags"],
                                "data": this.decrypt(document["data"]),
                                "data_type":document["data_type"],
                            },
                        };
                        res["id"] = results["id"];
                        return res
                    });

                    return getFiles;
                    
                }

            }
            return decryptedFiles;

        }).catch(error => {
            return error;
        });
        return filess;

    }




    async store({auth, params}) {

        const data = await auth.getUser();
    
        const keys = {
          'publicKey': data.public_key,
          'privateKey': data.private_key,
        }
        
        const assetdata = {
            'document': {
                'title': this.encrypt(params.title),
                'path': this.encrypt('medication.active'),
                'tags': ['medication'],
                'data': this.encrypt('HOI DIT IS ENORM BELANGRIJK'),
                'data_type': 'png'
            }
        }
        
        const metadata = {
            'created_by': this.encrypt('doctor_name'),
            'created_at': Date.now(),
            'patient': data.public_key,
            '_type': 'MEDICAL_FILE',


        }
        
        // Construct a transaction payload
        const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
                assetdata,
                metadata,
        
                // A transaction needs an output
                [ driver.Transaction.makeOutput(
                                driver.Transaction.makeEd25519Condition(keys.publicKey))
                ],
                keys.publicKey
        )
        
        // Sign the transaction with private keys of Alice to fulfill it
        const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, keys.privateKey)
        
        // Send the transaction off to BigchainDB
        const conn = new driver.Connection("http://localhost:9984/api/v1/")
        
        return conn.postTransactionCommit(txCreateAliceSimpleSigned)
                .then(retrievedTx => {console.log('Transaction', retrievedTx.id, 'successfully posted.')
                return retrievedTx; });
          }

          encrypt(data) {
            return CryptoJS.AES.encrypt(data, Config.get("AES_KEY")).toString();;
          }

          decrypt(data) {
            return CryptoJS.AES.decrypt(data, Config.get("AES_KEY")).toString(CryptoJS.enc.Utf8);
          }


}

module.exports = EhrController
