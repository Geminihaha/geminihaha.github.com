
import { sharedEventDispatcher } from './lib/event.js';
import * as ble from './lib/pixl.ble.js';
import * as proto from './lib/pixl.proto.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const connectButton = document.getElementById('connect-button');
    const sendButton = document.getElementById('send-button');
    const refreshButton = document.getElementById('refresh-button');
    const deleteButton = document.getElementById('delete-button');
    const fileInput = document.getElementById('file-input');
    const statusDiv = document.getElementById('status');
    const fileOperations = document.getElementById('file-operations');
    const fileListElement = document.getElementById('file-list');
    const ROOT_PATH = 'E:/'; // Assumption: The main drive is 'a:/'

    // Initialize protocol handler
    proto.init();

    // Initially hide the delete button
    deleteButton.style.display = 'none';

    // --- Event Listeners from BLE library ---

    sharedEventDispatcher().addListener('ble_connected', () => {
      statusDiv.textContent = 'Status: Connected';
      fileOperations.style.display = 'block';
      connectButton.style.display = 'none';
      // Automatically refresh file list on connect
      //refreshFileList();
    });

    sharedEventDispatcher().addListener('ble_disconnected', () => {
      statusDiv.textContent = 'Status: Not Connected';
      fileOperations.style.display = 'none';
      connectButton.style.display = 'block';
      fileListElement.innerHTML = ''; // Clear file list
      deleteButton.style.display = 'none'; // Hide delete button
    });

    sharedEventDispatcher().addListener('ble_connect_error', () => {
      statusDiv.textContent = 'Status: Connection Failed';
    });

    // --- UI Button Click Handlers ---

    if (connectButton) {
        connectButton.addEventListener('click', () => {
            statusDiv.textContent = 'Status: Connecting...';
            ble.connect().catch(err => {
                console.error("Connection error:", err);
                statusDiv.textContent = 'Status: Connection Failed';
            });
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            refreshFileList();
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const file = fileInput.files[0];
            if (!file) {
                alert('Please select a file to send.');
                return;
            }
            const targetPath = ROOT_PATH + file.name;

            statusDiv.textContent = `Status: Uploading ${file.name}...`;

            proto.vfs_helper_write_file(
                targetPath,
                file,
                (progress) => {
                    const percentage = Math.round((progress.written_bytes / progress.total_bytes) * 100);
                    statusDiv.textContent = `Status: Uploading ${file.name} (${percentage}%)`;
                },
                () => {
                    statusDiv.textContent = `Status: Upload complete: ${file.name}`;
                    // Refresh the file list to show the new file
                    refreshFileList();
                },
                (error) => {
                    statusDiv.textContent = `Status: Upload failed.`;
                    console.error('Upload error:', error);
                    alert(`Failed to upload file: ${error}`);
                }
            );
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const selectedFiles = document.querySelectorAll('input[name="selectedFiles"]:checked');
            if (selectedFiles.length === 0) {
                return; // Should not happen if button is hidden
            }

            if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
                const filesToDelete = Array.from(selectedFiles).map(checkbox => ROOT_PATH + checkbox.value);

                statusDiv.textContent = 'Status: Deleting files...';

                try {
                    for (const filePath of filesToDelete) {
                        await proto.vfs_remove(filePath);
                    }
                    statusDiv.textContent = 'Status: Files deleted successfully.';
                    refreshFileList();
                } catch (error) {
                    statusDiv.textContent = 'Status: Deletion failed.';
                    console.error('Deletion error:', error);
                    alert(`Failed to delete files: ${error}`);
                }
            }
        });
    }


    // --- Helper Functions ---

    async function refreshFileList() {
      fileListElement.innerHTML = `<li>Loading files from ${ROOT_PATH}...</li>`;
      deleteButton.style.display = 'none';
      try {
        const filesResponse = await proto.vfs_read_folder(ROOT_PATH);

        if (filesResponse.status !== 0) {
            console.error('Error reading folder:', filesResponse);
            fileListElement.innerHTML = `<li>Error loading files from ${ROOT_PATH}. Status: ${filesResponse.status}</li>`;
            return;
        }
        renderFileList(filesResponse.data);
      } catch (error) {
        console.error('Failed to read file list:', error);
        fileListElement.innerHTML = '<li>Error loading file list. See console for details.</li>';
      }
    }

    function renderFileList(files) {
      fileListElement.innerHTML = '';
      if (!files || files.length === 0) {
        fileListElement.innerHTML = '<li>No files found.</li>';
        return;
      }

      fileListElement.addEventListener('change', (event) => {
        if (event.target.name === 'selectedFiles') {
            const selectedCheckboxes = document.querySelectorAll('input[name="selectedFiles"]:checked');
            if (selectedCheckboxes.length > 0) {
                deleteButton.style.display = 'inline-block';
            } else {
                deleteButton.style.display = 'none';
            }
        }
      });

      files.forEach(file => {
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'selectedFiles';
        checkbox.value = file.name;
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(` ${file.name} (${file.size} bytes)`));
        fileListElement.appendChild(li);
      });
    }
});
