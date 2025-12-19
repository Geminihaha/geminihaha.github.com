/*
This is a communication protocol for Pixl.js
*/

import { sharedEventDispatcher } from './event.js';
import ByteBuffer from 'bytebuffer';

const VFS_FLAG_FILE = 1;
const VFS_FLAG_DIR = 2;

var pixlDevice;
var pixlRxCharacteristic;
var pixlTxCharacteristic;

export function init(device, rx, tx) {
  pixlDevice = device;
  pixlRxCharacteristic = rx;
  pixlTxCharacteristic = tx;

  sharedEventDispatcher().addListener('ble_data', onPixlData);
}

function onPixlData(data) {
  // data received from the BLE device
}

export function vfs_read_folder(path) {
  return new Promise((resolve, reject) => {
    // Implementation for reading a folder
    resolve({ status: 0, data: [] });
  });
}

export function vfs_helper_write_file(path, file, onProgress, onDone, onFail) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      // Mock implementation of file writing
      onProgress({ written_bytes: buffer.byteLength, total_bytes: buffer.byteLength });
      onDone();
      resolve();
    };
    reader.onerror = (e) => {
      onFail(e);
      reject(e);
    };
    reader.readAsArrayBuffer(file);
  });
}

// Other protocol functions can be added here
