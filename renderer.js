// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { remote, ipcRenderer } = require("electron");
const os = require("os");
const mainProcess = remote.require("./main");
const { BrowserWindow } = remote;
const prompt = require("electron-prompt");
const { login } = require("./auth");
const { google } = require("googleapis");
const drive = google.drive("v3");
const gdocs = google.docs("v1");
let auth;
let gnocsFolder;

// Elements
const sidebar = document.getElementById("sidebar");
const docs = document.getElementById("docs");
const list = document.querySelector("ul");
const webview = document.querySelector("webview");

const popupwin = async targeturl => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    titleBarStyle: "hiddenInset",
    width: 1024,
    height: 768
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
    gnocsFolder = res.data.files.find(
      file => file.name.toLocaleLowerCase() === "gnotes"
    );
    const childrens = await listFolderChildrens(gnocsFolder.id);
    return renderChildrens(childrens);
  } else {
    return createGnocsFolder();
  }
}

async function listFolderChildrens(id) {
  list.innerHTML = "";
  const res = await drive.files.list({
    q: `'${id}' in parents and trashed = false`,
    fields: "files(id, name, parents, mimeType)"
  });
  console.log("Files: ", res);
  return res.data.files;
}

function updateWebview(url) {
  webview.setAttribute("src", url);
  webview.addEventListener("dom-ready", e => {
    webview.insertCSS(
      "#headingStyleSeparator, #printButton, #spellGrammarCheckButton, #undoButton, #redoButton { display: none; }"
    );
    webview.insertCSS(
      "div#docs-omnibox-toolbar, #docs-omnibox-autocomplete, #formatPainterButton, #zoomSelect, #zoomComboBoxSeparator { display: none; }"
    );
    webview.insertCSS(
      "div#docs-toolbar-wrapper { padding-left: 10px !important; }"
    );
  });
}

async function handleFolderClick(id, name, parents) {
  list.innerHTML = "";
  const childrens = await listFolderChildrens(id);
  const currentFolder = document.getElementById("current-folder");
  currentFolder.innerHTML = name || "Home";
  currentFolder.dataset.parentFolder = parents[0] || gnocsFolder.id;
  renderChildrens(childrens);
}

async function renderChildrens(files) {
  const render = ({ name, id, mimeType, parents }) => {
    const li = document.createElement("li");
    const i = document.createElement("i");
    if (mimeType === "application/vnd.google-apps.folder") {
      i.classList.add("folder", "fa", "fa-folder");
      li.addEventListener("click", e => {
        handleFolderClick(id, name, parents);
      });
    } else {
      i.classList.add("fa", "fa-file-text");
      const url = "https://docs.google.com/document/d/" + id;
      li.addEventListener("click", e => {
        updateWebview(url);
      });
    }
    li.innerHTML = name;
    li.insertAdjacentElement("afterbegin", i);
    list.appendChild(li);
  };
  files.forEach(item => render(item));
}

const toggleSidebar = document.getElementById("toggle-sidebar");
toggleSidebar.addEventListener("click", e => {
  if (sidebar.clientWidth >= 100) {
    sidebar.style.width = "70px";
    docs.style.opacity = "0";
  } else {
    sidebar.style.width = "300px";
    docs.style.opacity = "1.0";
  }
});

const breadcrumbs = document.getElementById("breadcrumbs");
breadcrumbs.addEventListener("click", async e => {
  handleFolderClick();
});

const addDoc = document.getElementById("add-doc");
addDoc.addEventListener("click", e => {
  prompt("Doc Title").then(async title => {
    if (title === null) {
      console.log("user cancelled");
    } else {
      // const createResponse = await gdocs.documents.create({
      //     requestBody: {
      //       title: r
      //     }
      //   });
      const folderId = gnocsFolder.id;
      var fileMetadata = {
        name: title,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId]
      };
      await drive.files.create(
        {
          resource: fileMetadata,
          fields: "id"
        },
        async function(err, file) {
          if (err) {
            // Handle error
            console.error(err);
          } else {
            const url = "https://docs.google.com/document/d/" + file.data.id;
            updateWebview(url);
            const childrens = await listFolderChildrens(gnocsFolder.id);
            renderChildrens(childrens);
          }
        }
      );
    }
  });
});

getGnocsFolder();
