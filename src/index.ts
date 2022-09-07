//Keys
const CLIENT_ID='348082241878-cs449b7puvsr2u1mm9lnhu479otpelh9.apps.googleusercontent.com';

const CLIENT_SECRET = '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'

const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const REFRESH_TOKEN = '1//044fVzkcMl0txCgYIARAAGAQSNwF-L9IrnSiinpoYmi5uvRp5Z-sXbzQrZB1hr-igQeFxLEP4I-WmH7bvg16TFkXJtP_yNeq72SQ';


import express, {Request, Response} from 'express';
import {v4 as uuidv4 } from 'uuid';

import bodyParser from 'body-parser';
import Redis  from 'ioredis';

const {google} = require('googleapis');
const redis = new Redis();
const app = express();

//Setting up googleapis

const oauth2Client  = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
    {
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/drive.photos.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
    ]}
)


oauth2Client.setCredentials({refresh_token: REFRESH_TOKEN});



const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
})

let token: number;

async function watchDir(){

    let starterToken;
    try {
        const response = await drive.changes.getStartPageToken({});
        const token = response.data.startPageToken;
        starterToken = token;
        console.log(token);
      } catch (err) {
        // TODO(developer) - Handle error
        throw err;
      }
        const res = await drive.changes.watch({
        pageToken: starterToken,
        requestBody: {
            "kind": "api#channel",
            "id": `${uuidv4()}`,
            'resourceId': '1piV0mhlwH0XQX34IRgFeLmhcbSBdl6cKQDlZ-jxp3II',
            "address": 'https://5751-2405-201-401e-60c8-a945-2c6-66c9-9bcb.in.ngrok.io/logs',
            "type": 'web_hook',
            'payload': 'true'
        }
    })
    
    token = starterToken;
}

const getChanges = async ()=>{
    const response = await drive.changes.list({
        pageToken: token,
    });
    console.log(response.data.changes);
    const key = 'drive-change-'+ uuidv4();
    const value  = response.data.changes.toString();
        redis.setex(key, 100, value);
  
}


watchDir();

app.use(express.json());

app.post('/logs', (req, res) => {
    if(req){
        getChanges();
    }
})

app.get('/logs', (req, res) => {
    console.log(res.json());

})


app.listen(9000, () => {
    console.log(`Server is listening on port 9000`);
});