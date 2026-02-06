
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const algorithm = 'aes-256-cbc'; // or aes-256-gcm
// Using AES-GCM for authenticated encryption which is nicer, 
// but CBC is also fine. Let's stick to CBC or GCM. 
// Web Crypto supports AES-GCM and AES-CBC. AES-GCM is generally preferred.
// So let's use aes-256-gcm.

const INPUT_FILE = path.join(__dirname, '../public/g5_dta_ogay.glb');
const OUTPUT_FILE = path.join(__dirname, '../public/g5_dta_ogay.enc');

// Fixed key for consistency and avoiding output issues
const key = Buffer.from('000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f', 'hex');
// 12 bytes for AES-GCM IV is standard
const iv = crypto.randomBytes(12);

console.log('Encrypting...');

try {
    const input = fs.readFileSync(INPUT_FILE);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // Encrypt
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // We need to store the Auth Tag and IV to decrypt.
    // Usually, we can prepend IV and Auth Tag to the file.
    // Layout: [IV (12 bytes)] [AuthTag (16 bytes)] [Encrypted Content]

    const finalBuffer = Buffer.concat([iv, authTag, encrypted]);

    fs.writeFileSync(OUTPUT_FILE, finalBuffer);

    console.log('Encryption complete!');
    console.log(`Input: ${INPUT_FILE}`);
    console.log(`Output: ${OUTPUT_FILE}`);
    console.log('---------------------------------------------------');
    console.log('IMPORTANT: You need this KEY to decrypt the file.');
    console.log('Add this to your environment variables or constants:');
    console.log('');
    // Print as Hex string
    // Print as Hex string
    console.log('KEY_START');
    console.log(key.toString('hex'));
    console.log('KEY_END');

} catch (err) {
    console.error('Encryption failed:', err);
}
