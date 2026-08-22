const { google } = require('googleapis');
const path=require('path')
const fs = require('fs');
//const { makeDocumentPublic } = require('./google-docs');

const uploadFileToDrive = async (filePath, fileName, mimeType = 'application/sql') => {
  const { drive } = require('googleapis').google;
  
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'google-docs-key.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const driveClient = drive({ version: 'v3', auth });

  const fileMetadata = {
    name: fileName,
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const res = await driveClient.files.create({
    resource: fileMetadata,
    media,
    fields: 'id',
  });

  console.log(`✅ Backup uploaded to Google Drive with ID: ${res.data.id}`);
  //makeDocumentPublic(res.data.id)
  return res.data.id;
};


const listLastFiles = async (limit = 10) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'google-docs-key.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const driveClient = google.drive({
    version: 'v3',
    auth,
  });

  const res = await driveClient.files.list({
    pageSize: limit,
    orderBy: 'createdTime desc',
    fields: 'files(id, name, mimeType, createdTime, modifiedTime, webViewLink, size)',
  });

  return res.data.files;
};

let d=listLastFiles()
console.log(d)

module.exports=uploadFileToDrive
