"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Keys
const CLIENT_ID = '348082241878-cs449b7puvsr2u1mm9lnhu479otpelh9.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//044fVzkcMl0txCgYIARAAGAQSNwF-L9IrnSiinpoYmi5uvRp5Z-sXbzQrZB1hr-igQeFxLEP4I-WmH7bvg16TFkXJtP_yNeq72SQ';
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const ioredis_1 = __importDefault(require("ioredis"));
const { google } = require('googleapis');
const redis = new ioredis_1.default();
const app = (0, express_1.default)();
//Setting up googleapis
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, {
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/drive.photos.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
    ]
});
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});
let token;
function watchDir() {
    return __awaiter(this, void 0, void 0, function* () {
        let starterToken;
        try {
            const response = yield drive.changes.getStartPageToken({});
            const token = response.data.startPageToken;
            starterToken = token;
            console.log(token);
        }
        catch (err) {
            // TODO(developer) - Handle error
            throw err;
        }
        const res = yield drive.changes.watch({
            pageToken: starterToken,
            requestBody: {
                "kind": "api#channel",
                "id": `${uuid_1.v4()}`,
                'resourceId': '1piV0mhlwH0XQX34IRgFeLmhcbSBdl6cKQDlZ-jxp3II',
                "address": 'https://5751-2405-201-401e-60c8-a945-2c6-66c9-9bcb.in.ngrok.io/logs',
                "type": 'web_hook',
                'payload': 'true'
            }
        });
        token = starterToken;
    });
}
const getChanges = () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield drive.changes.list({
        pageToken: token,
    });
    console.log(response.data.changes);
    const key = 'drive-change-' + (0, uuid_1.v4)();
    const value = response.data.changes.toString();
    redis.setex(key, 100, value);
});
watchDir();
app.use(express_1.default.json());
app.post('/logs', (req, res) => {
    if (req) {
        getChanges();
    }
});
app.get('/logs', (req, res) => {
    console.log(res.headers);
});
app.listen(8000, () => {
    console.log(`Server is listening on port 8000`);
});
