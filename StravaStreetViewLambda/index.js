const fetch = require('node-fetch')

const client_id = "";
const auth_token="";

exports.handler = async (event, context, callback) => {
    console.log("event/n"+JSON.stringify(event));
    
    var url = "https://graph.mapillary.com/token";
    var code = event.queryStringParameters.code;
    
    console.log("code is " + code);

    var data={
        "grant_type": "authorization_code",
        "code": code,
        "client_id": this.client_id
    }
    
    const apiResponse = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.auth_token
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    
    console.log("awaiting api response");
    
    var res = await apiResponse.json();
    
    console.log("api response is " + JSON.stringify(res));
    
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify(res),
    };
    
    callback(null, response);
};
