const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const zipFolder = require('zip-folder');

module.exports = function deployFolderAsZip(directoryPath, archiveFileName, awsBucketName, awsAccessKeyId, awsSecretAccessKey, awsRegion = 'us-east-1') {
  if (!directoryPath) {
    throw new Error('no directory provided');
  }
  if (!archiveFileName) {
    throw new Error('no name for archive file provided');
  }
  if (!awsBucketName) {
    throw new Error('no aws bucket provided');
  }
  if (!awsAccessKeyId || !awsSecretAccessKey) {
    throw new Error('accessKeyId and secretAccessKey are required to work with AWS');
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

  zipFolder(directoryPath, path.resolve(`./${archiveFileName}.zip`), function(err) {
    if (err) {
      return console.error(err);
    }
    fs.readFile(`./${archiveFileName}.zip`, (e, fileContent) => {
      if (e) {
        return console.error(e);
      }
      let key = `${archiveFileName}.zip`;
      const objectParams = Object.assign({
        Key: key,
        Body: fileContent
      }, params);
      // upload file to S3
      s3.putObject(objectParams, error => {
        if (error) {
          throw error;
        }
        console.log(`${objectParams.Key} - success`);
      });
    });
  });
};