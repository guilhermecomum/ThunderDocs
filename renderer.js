// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { remote, ipcRenderer } = require("electron");
const os = require("os");
const mainProcess = remote.require("./main");
const { BrowserWindow } = remote;
const { login, logout } = require("./auth");
const { google } = require("googleapis");
const drive = google.drive("v3");
let auth;

const popupwin = async targeturl => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    titleBarStyle: "hiddenInset",
    width: 800,
    height: 600
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.webContents.executeJavaScript(
    "document.querySelector('webview').setAttribute('src','" + targeturl + "')",
    () => {
      console.log("INFO: another document opened");
    }
  );
  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

async function createGnocsFolder() {
  const fileMetadata = {
    name: "gNotes",
    mimeType: "application/vnd.google-apps.folder"
  };
  drive.files.create(
    {
      resource: fileMetadata,
      fields: "id"
    },
    function(err, file) {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        console.log("Folder Id: ", file.id);
      }
    }
  );
}

async function getGnocsFolder() {
  auth = await login();
  google.options({ auth });
  const res = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.folder' and name = 'gNotes'"
  });
  if (res.data.files.length !== 0) {
    const gnocs = res.data.files.find(
      file => file.name.toLocaleLowerCase() === "gnotes"
    );
    return listGnocsChildrens(gnocs);
  } else {
    return createGnocsFolder();
  }
}

getGnocsFolder();

async function listGnocsChildrens(gnocs) {
  console.log(`'${gnocs.id}' in parents`);
  const res = await drive.files.list({
    q: `'${gnocs.id}' in parents`
  });
  return renderFiles(res.data.files);
}

async function renderFiles(files) {
  const sidebar = document.querySelector("sidebar");
  const list = document.querySelector("ul");
  const render = ({ name, id }) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    const url = "https://docs.google.com/document/d/" + id;
    a.setAttribute("href", url);
    a.innerHTML = name;
    li.appendChild(a);
    list.appendChild(li);
  };
  files.forEach(item => render(item));
}

//runSample();
const webview = document.querySelector("webview");
webview.addEventListener("new-window", e => {
  // if user click link...
  event.preventDefault();
  if (e.url.includes("docs.google.com")) {
    popupwin(e.url);
  } else {
    require("electron").shell.openExternal(e.url);
  }
});

if (os.platform() != "darwin") {
  webview.style.marginTop = "0px";
}
