const NUS_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";


class BLEFileTransfer {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
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

      console.log('Getting Characteristic...');
      this.characteristic = await this.service.getCharacteristic(NUS_SERVICE_UUID);

      console.log('Connected to BLE device');
    } catch (error) {
      console.error(error);
    }
  }

  async sendFile(file) {
    if (!this.characteristic) {
      console.error('Not connected to a BLE device');
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
          await this.characteristic.writeValue(chunk);
          console.log(`Sent chunk of size ${chunk.length}`);
        } catch (error) {
          console.error(error);
        }
      }

      console.log('File sent successfully');
    };

    fileReader.readAsArrayBuffer(file);
  }
}
