#!/usr/bin/env node

/**
 * Script to upload GeoLite2 database to Firebase Storage
 * Usage: node upload-geolite2.js [path-to-mmdb-file]
 *
 * If no path is provided, it will look for GeoLite2-Country.mmdb in the current directory
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccount) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  console.error('Please set it to the path of your Firebase service account JSON file');
  console.error('Example: export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: '' // Your Firebase Storage bucket
});

async function uploadDatabase() {
  try {
    // Get the file path from command line or use default
    const filePath = process.argv[2] || './GeoLite2-Country.mmdb';

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found at ${filePath}`);
      console.error('Usage: node upload-geolite2.js [path-to-GeoLite2-Country.mmdb]');
      process.exit(1);
    }

    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

    console.log(`Uploading ${fileName} (${fileSizeMB} MB) to Firebase Storage...`);

    // Get a reference to the storage bucket
    const bucket = admin.storage().bucket();

    // Upload the file to the geolite2 folder
    const destination = `geolite2/${fileName}`;

    await bucket.upload(filePath, {
      destination: destination,
      metadata: {
        contentType: 'application/octet-stream',
        metadata: {
          uploadedAt: new Date().toISOString(),
          description: 'MaxMind GeoLite2 Country Database',
          source: 'https://www.maxmind.com'
        }
      }
    });

    console.log(`✅ Successfully uploaded to: ${destination}`);

    // Make the file publicly readable (optional - remove if you want private access)
    // await bucket.file(destination).makePublic();
    // console.log('✅ File is now publicly accessible');

    // Get the download URL (for private access)
    const file = bucket.file(destination);
    const [metadata] = await file.getMetadata();

    console.log('\nFile Details:');
    console.log(`- Name: ${metadata.name}`);
    console.log(`- Size: ${fileSizeMB} MB`);
    console.log(`- Created: ${metadata.timeCreated}`);
    console.log(`- Updated: ${metadata.updated}`);
    console.log(`- Storage path: gs://${bucket.name}/${destination}`);

    console.log('\n✅ Database successfully uploaded to Firebase Storage!');
    console.log('Your Cloud Functions will now automatically use this database.');

  } catch (error) {
    console.error('Error uploading file:', error);
    process.exit(1);
  }
}

// Run the upload
uploadDatabase().then(() => {
  console.log('\nNext steps:');
  console.log('1. Deploy your functions: firebase deploy --only functions');
  console.log('2. The functions will automatically download and use the database');
  console.log('3. To update the database, download a new version from MaxMind and run this script again');
  process.exit(0);
}).catch(error => {
  console.error('Upload failed:', error);
  process.exit(1);
});