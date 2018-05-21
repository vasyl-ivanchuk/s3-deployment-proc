const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const mime = require('mime-types');

module.exports = function deploy(directoryPath, rootFolderName, awsBucketName, awsAccessKeyId, awsSecretAccessKey, awsRegion = 'us-east-1') {
  if (!directoryPath) {
    throw 'no directory provided';
  }
  if (!awsBucketName) {
    throw 'no aws bucket provided';
  }
  if (!awsAccessKeyId || !awsSecretAccessKey) {
    throw 'accessKeyId and secretAccessKey are required to work with AWS';
  }
  const s3 = new AWS.S3({
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsRegion
  });
  const params = {
    ACL: 'public-read',
    Bucket: awsBucketName
  }
  uploadFolderToS3();

  function uploadFolderToS3(prefix = '') {
    let folderPath = directoryPath;
    if (prefix) {
      folderPath = `${folderPath}/${prefix}`;
    }
    fs.readdir(folderPath, (e, files) => {
      if (e) {
        throw e;
      }
      if (!files || files.length === 0) {
        console.log(`provided folder '${folderPath}' is empty or does not exist.`);
        console.log('Make sure the build was completed!');
        return;
      }
      for (let fileName of files) {
        const filePath = path.join(folderPath, fileName);
        fs.lstat(filePath, (err, stats) => {
          if (err) {
            throw err;
          }
          // run again if directory
          if (stats.isDirectory()) {
            if (prefix) {
              uploadFolderToS3(`${prefix}/${fileName}`);
            } else {
              uploadFolderToS3(fileName);
            }
          } else {
            fs.readFile(filePath, (_err, fileContent) => {
              if (_err) {
                throw _err;
              }
              let key = prefix ? `${prefix}/${fileName}`.split('\\').join('/') : fileName;
              if (rootFolderName) {
                key = `${rootFolderName}/${key}`;
              }
              const objectParams = Object.assign({
                Key: key,
                Body: fileContent
              }, params);
              const contentType = mime.contentType(path.extname(filePath));
              if (contentType) {
                objectParams.ContentType = contentType;
              }
              // upload file to S3
              s3.putObject(objectParams, error => {
                if (error) {
                  throw error;
                }
                console.log(`${objectParams.Key} - success`);
              });
            });
          }
        });
      }
    });
  }
}