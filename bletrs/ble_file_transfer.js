const NUS_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_WRITE_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // RX on device
const NUS_NOTIFY_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // TX on device

class BLEFileTransfer {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.writeCharacteristic = null;
    this.notifyCharacteristic = null;
    this.onFileListReceived = null;
    this._receivedBuffer = '';
  }

  async connect() {
    try {
      console.log('Requesting Bluetooth Device...');
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [NUS_SERVICE_UUID] }],
      });

      console.log('Connecting to GATT Server...');
      this.server = await this.device.gatt.connect();

      console.log('Getting Service...');
      this.service = await this.server.getPrimaryService(NUS_SERVICE_UUID);

      console.log('Getting Characteristics...');
      this.writeCharacteristic = await this.service.getCharacteristic(NUS_WRITE_CHAR_UUID);
      this.notifyCharacteristic = await this.service.getCharacteristic(NUS_NOTIFY_CHAR_UUID);

      await this.notifyCharacteristic.startNotifications();
      this.notifyCharacteristic.addEventListener('characteristicvaluechanged', this._handleNotifications.bind(this));
      
      console.log('Connected to BLE device');
      return true;
    } catch (error) {
      alert(error);
      console.error(error);
      return false;
    }
  }

  _handleNotifications(event) {
    const value = event.target.value;
    const decoder = new TextDecoder();
    const text = decoder.decode(value);
    console.log('Received:', text);

    this._receivedBuffer += text;

    // Assume file list comes in format: "FILES:file1.txt,file2.jpg\n"
    if (this._receivedBuffer.includes('\n')) {
      const lines = this._receivedBuffer.split('\n');
      this._receivedBuffer = lines.pop(); // Keep partial line in buffer

      for (const line of lines) {
        if (line.startsWith('FILES:')) {
          const files = line.substring(6).split(',').filter(f => f.trim().length > 0);
          if (this.onFileListReceived) {
            this.onFileListReceived(files);
          }
        }
      }
    }
  }

  async requestFileList() {
    if (!this.writeCharacteristic) {
      alert('Not connected');
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode('LIST\n');
    try {
      await this.writeCharacteristic.writeValue(data);
      console.log('Requested file list');
    } catch (error) {
      console.error('Error requesting file list:', error);
    }
  }

  async sendFile(file) {
    if (!this.writeCharacteristic) {
      const message = 'Not connected to a BLE device';
      alert(message);
      console.error(message);
      return;
    }

    const chunkSize = 20;
    const fileReader = new FileReader();

    fileReader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      let offset = 0;

      while (offset < data.length) {
        const chunk = data.slice(offset, offset + chunkSize);
        offset += chunk.length;

        try {
          await this.writeCharacteristic.writeValue(chunk);
          console.log(`Sent chunk of size ${chunk.length}`);
        } catch (error) {
          alert(error);
          console.error(error);
          break;
        }
      }

      console.log('File sent successfully');
    };

    fileReader.readAsArrayBuffer(file);
  }
}
