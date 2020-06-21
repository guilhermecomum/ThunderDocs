const os = require("os");
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");

async function login() {
  const token = false;

  if (!token) {
    try {
      const auth = await authenticate({
        keyfilePath: path.join(__dirname, "./oauth2.keys.json"),
        scopes:
          "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.readonly"
      });
      return auth;
    } catch (error) {
      await logout();
      throw error;
    }
  } else {
    return JSON.parse(token);
  }
}

module.exports = {
  login
};
