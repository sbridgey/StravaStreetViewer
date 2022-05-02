const fetch = require('node-fetch')
var AWS = require('aws-sdk')
AWS.config.update({ region: 'eu-west-1' });
var ssm = new AWS.SSM();

const client_id = "mapillary_ClientId";
const client_secret = "mapillary_ClientSecret";
const access_token = "mapillary_AccessToken";
const access_token_expiry_date = "mapillary_AccessToken_ExpiryDate";

exports.handler = async (event, context, callback) => {
    var expiryDate = await getSSMParameter(access_token_expiry_date);
    var date = new Date(expiryDate);
    var now = new Date();

    if(date>=now){
        refreshToken();
    }

    let res = await getSSMParameter(access_token);

    let resObject = {
        token: res
    };

    const response = {
        statusCode: 200,
        body: JSON.stringify(resObject),
    };

    callback(null, response);
}

async function refreshToken(){

    var clientId = await getSSMParameter(client_id);
    var secret = await getSSMParameter(client_secret);
    var token = await getSSMParameter(access_token);

    var data = {
        "grant_type": "refresh_token",
        "refresh_token": token,
        "client_id": clientId
    }

    const apiResponse = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
            'Content-Type': 'application/json',
            'Authorization': "OAuth "+ secret
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });

    console.log("awaiting api response");

    var res = await apiResponse.json();

    console.log("api response is " + JSON.stringify(res));

    if(res.access_token){
        storeSSMParameter(access_token, res.access_token);
        var tokenExpiryDate = ((Date.now()/1000) + res.expires_in).toString();
        console.log(tokenExpiryDate)
        storeSSMParameter(access_token_expiry_date,tokenExpiryDate)
    }
}

async function getSSMParameter(name) {
    let parameter = {
        Name: name,
        WithDecryption: false
      };

    const data = await ssm.getParameter(parameter).promise();

    console.log(data);
    console.log(data.Parameter.Value);

    return data.Parameter.Value;
}

async function storeSSMParameter(key, value){

    let parameter = {
        Name: key,
        Value: value,
        Overwrite: true
    }

    const result = await ssm.putParameter(parameter).promise();

    console.log(result);

    return result;
}