const os = require("os");
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const keytar = require("keytar");

const keytarService = "google-oauth";
const keytarAccount = os.userInfo().username;

async function login() {
  const token = false;
  //const token = await keytar.getPassword(keytarService, keytarAccount);

  if (!token) {
    try {
      const auth = await authenticate({
        keyfilePath: path.join(__dirname, "./oauth2.keys.json"),
        scopes:
          "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.readonly"
      });
      await keytar.setPassword(
        keytarService,
        keytarAccount,
        JSON.stringify(auth)
      );
      return auth;
    } catch (error) {
      await logout();
      throw error;
    }
  } else {
    return JSON.parse(token);
  }
}

async function logout() {
  await keytar.deletePassword(keytarService, keytarAccount);
}

module.exports = {
  login,
  logout
};

// _events: [Object: null prototype] {},
// _eventsCount: 0,
// _maxListeners: undefined,
// transporter: DefaultTransporter {},
// credentials:
//  { access_token:
//     'ya29.a0AfH6SMBPua08W_26danxlf9vfpnvbVimVngbM-1PpEyLmQZOvxNJG5eAx6zx-jjEy06M-VB5l9xW2h-DB4pOiUgw3EMOOeNWq9yWHOQbetkET7jS90sSqBxOZ0Ji6NpGroJzUUVvxgW9P2MiYF5arQ0NqUZE6BrEb8c',
//    refresh_token:
//     '1//0hcYWGrBxewJgCgYIARAAGBESNwF-L9IrbkaDQGnwhGHbdAouwAwNp57JSs15CmREI3YZpO0snw2tMG8-q4oTO60BSosm8HfEdug',
//    scope:
//     'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive',
//    token_type: 'Bearer',
//    expiry_date: 1592518253102 },
// certificateCache: {},
// certificateExpiry: null,
// certificateCacheFormat: 'PEM',
// refreshTokenPromises: Map {},
// _clientId:
//  '53694787041-22smp6ut866g0nghu5vmavdbusn23feu.apps.googleusercontent.com',
// _clientSecret: undefined,
// redirectUri: 'http://localhost:3000/oauth2callback',
// eagerRefreshThresholdMillis: 300000,
// forceRefreshOnFailure: false }
