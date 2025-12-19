/*
This is the comms protocol for pixl.js
*/

import { sharedEventDispatcher } from './event.js';
import * as ble from './pixl.ble.js';
import ByteBuffer from 'bytebuffer';

const CMD_VFS_READ_FILE = 1;
const CMD_VFS_WRITE_FILE = 2;
const CMD_VFS_DELETE_FILE = 3;
const CMD_VFS_LIST_FILES = 4;
const CMD_VFS_GET_MTU = 5;

const FLAG_START_OF_FILE = 1;
const FLAG_END_OF_FILE = 2;
const FLAG_ERROR_CONDITION = 4;

var op_queue = [];
var op_ongoing = false;
var op_promise;

var rx_promise_resolve;
var rx_promise_reject;
var rx_promise_timeout;

function new_rx_promise() {
  op_promise = new Promise((resolve, reject) => {
    rx_promise_resolve = resolve;
    rx_promise_reject = reject;
  });

  // Fails after 2 seconds
  rx_promise_timeout = setTimeout(() => {
    rx_promise_reject('timeout');
  }, 2000);
  return op_promise;
}

function process_op_queue() {
  if (op_ongoing) {
    return;
  }
  if (op_queue.length > 0) {
    var op = op_queue.shift();
    proocess_op(op);
  }
}

function proocess_op(op) {
  new_rx_promise()
    .then((data) => {
      try {
        var bb = ByteBuffer.wrap(data, true);
        var h = read_header(bb);
        h.data = op.rx_data_cb(bb);
        op_ongoing = false;
        op.p_resolve(h);
        process_op_queue();
        return h;
      } catch (e) {
        op.p_reject(e);
      }
    })
    .catch((e) => {
      op_ongoing = false;
      op.p_reject(e);
      process_op_queue();
    });

  var bb = new ByteBuffer(undefined, true);
  op.tx_data_cb(bb);
  op_ongoing = true;
  tx_data_frame(op.cmd, 0, 0, bb).catch((e) => {
    op.p_reject(e);
  });
}

var m_api_resolve;
var m_api_reject;

export function init() {
  sharedEventDispatcher().addListener('ble_rx_data', on_rx_data);
  sharedEventDispatcher().addListener('ble_disconnected', on_ble_disconnected);
}

function on_ble_disconnected() {
  if (op_ongoing) {
    op_ongoing = false;
    rx_promise_reject('disconnected');
    process_op_queue();
  }
}

function on_rx_data(data) {
  rx_promise_resolve(data);
}

function add_op(op) {
  var p = new Promise((resolve, reject) => {
    op.p_resolve = resolve;
    op.p_reject = reject;
  });
  op_queue.push(op);
  process_op_queue();
  return p;
}

function read_header(bb) {
  var len = bb.readShort();
  var flags = bb.readByte();
  var status = bb.readByte();
  return {
    len: len,
    flags: flags,
    status: status,
  };
}

async function tx_data_frame(cmd, flags, status, payload_bb) {
  var header_bb = new ByteBuffer(4, true);
  header_bb.writeShort(payload_bb.limit);
  header_bb.writeByte(flags);
  header_bb.writeByte(status);
  var bb = ByteBuffer.concat([header_bb.flip(), payload_bb.flip()], true);
  await ble.send(cmd, bb.buffer);
}

// Higher level API functions
export function vfs_get_mtu() {
  return add_op({
    cmd: CMD_VFS_GET_MTU,
    tx_data_cb: (bb) => {},
    rx_data_cb: (bb) => {
      return {
        mtu: bb.readInt(),
      };
    },
  });
}

export function vfs_list_files(path) {
  return add_op({
    cmd: CMD_VFS_LIST_FILES,
    tx_data_cb: (bb) => {
      bb.writeCString(path);
    },
    rx_data_cb: (bb) => {
      var files = [];
      while (bb.remaining() > 0) {
        var file = {};
        file.name = bb.readCString();
        file.size = bb.readInt();
        files.push(file);
      }
      return files;
    },
  });
}

export function vfs_delete_file(path) {
  return add_op({
    cmd: CMD_VFS_DELETE_FILE,
    tx_data_cb: (bb) => {
      bb.writeCString(path);
    },
    rx_data_cb: (bb) => {
      return {};
    },
  });
}

export function vfs_write_file(path, data) {
  var mtu = 200; // default mtu
  vfs_get_mtu().then((h) => {
    mtu = h.data.mtu;
  });

  return new Promise((resolve, reject) => {
    var offset = 0;
    function write_chunk() {
      var chunk_size = Math.min(data.byteLength - offset, mtu);
      var chunk = data.slice(offset, offset + chunk_size);
      var flags = 0;
      if (offset == 0) {
        flags |= FLAG_START_OF_FILE;
      }
      if (offset + chunk_size == data.byteLength) {
        flags |= FLAG_END_OF_FILE;
      }
      add_op({
        cmd: CMD_VFS_WRITE_FILE,
        tx_data_cb: (bb) => {
          bb.writeCString(path);
          bb.writeInt(data.byteLength);
          bb.append(chunk);
        },
        rx_data_cb: (bb) => {
          return {};
        },
      })
        .then((h) => {
          offset += chunk_size;
          if (offset < data.byteLength) {
            write_chunk();
          } else {
            resolve(h);
          }
        })
        .catch((e) => {
          reject(e);
        });
    }
    write_chunk();
  });
}
