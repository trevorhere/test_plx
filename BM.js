/* eslint-disable quotes */
import React, {Component} from 'react';
import {BleManager} from 'react-native-ble-plx';
import base64 from 'react-native-base64';

import {View, Button, Alert, Text} from 'react-native';

class BM extends Component {
  constructor(props) {
    super(props);
    this.manager = new BleManager();
    this.device = null;
    this.state = {info: '', values: {}, message: ''};
    this.prefixUUID = 'f000aa';
    this.suffixUUID = '-0451-4000-b000-000000000000';
    this.sensors = {
      0: 'Temperature',
      1: 'Accelerometer',
      2: 'Humidity',
      3: 'Magnetometer',
      4: 'Barometer',
      5: 'Gyroscope',
    };
    this.volChar = '088a1e2a-1991-411e-8a73-f71bdcd7487c';
    this.soundMessage = 'no sound detected';
  }



  serviceUUID(num) {
    return this.prefixUUID + num + '0' + this.suffixUUID;
  }

  notifyUUID(num) {
    return this.prefixUUID + num + '1' + this.suffixUUID;
  }

  writeUUID(num) {
    return this.prefixUUID + num + '2' + this.suffixUUID;
  }

  info(message) {
    this.setState({info: message});
  }

  error(message) {
    this.setState({info: '', message: ''});
  }

  disconnect() {
    if (this.device) {
      this.device.cancelConnection();
      this.setState({info: '', message: ''});
      this.device = null;
    } else {
      console.log('no device detected');
    }
  }

  updateValue(key, value) {
    const decodedVal = base64.decode(value);
    console.log('value', decodedVal);
    this.setState({
      message: decodedVal,
    });
    // this.setState({values: {...this.state.values, [key]: value}});
  }

  async on() {
    const rCHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
    const service = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'; //this.serviceUUID(id);

    if (this.device) {
      await this.device.writeCharacteristicWithResponseForService(
        service,
        this.volChar,
        base64.encode('1'),
      );
    } else {
      console.log('device not detected');
    }
  }

  async off() {
    const rCHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
    const service = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'; //this.serviceUUID(id);

    if (this.device) {
      await this.device.writeCharacteristicWithResponseForService(
        service,
        this.volChar,
        base64.encode('0'),
      );
    } else {
      console.log('device not detected');
    }
  }

  async fetchValue() {
    console.log('fetching val');
    const service = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'; //this.serviceUUID(id);
    const characteristicW = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'; // this.writeUUID(id);
    const characteristicN = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'; // this.notifyUUID(id);

    if (this.device) {
      this.device
        .readCharacteristicForService(service, characteristicN)
        .then(res => {
          console.log('val', base64.decode(res.value));
          this.setState({
            message: base64.decode(res.value),
          });
        });

      //   (error, characteristic) => {
      //     if (error) {
      //       this.error(error.message);
      //       return;
      //     }
      //     this.updateValue(characteristic.uuid, characteristic.value);
      //   },
      // );
    } else {
      console.log('no device detected');
    }
  }

  componentDidMount() {
    this.soundMessage = setInterval(() => this.fetchValue(), 500);
  }

  async setupNotifications(device) {
    const service = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'; //this.serviceUUID(id);
    const characteristicW = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'; // this.writeUUID(id);
    const characteristicN = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'; // this.notifyUUID(id);

    const characteristic = await device.writeCharacteristicWithResponseForService(
      service,
      characteristicW,
      'AQ==',
    );

    device.monitorCharacteristicForService(
      service,
      characteristicN,
      (error, characteristic) => {
        if (error) {
          this.error(error.message);
          return;
        }
        this.updateValue(characteristic.uuid, characteristic.value);
      },
    );
  }

  scanAndConnect() {
    this.manager.startDeviceScan(null, null, (error, device) => {
      this.info('Scanning...');
      console.log('Device: ', device.name);
      // Alert.alert('Scanning');
      // console.log(device);

      if (error) {
        this.error('Error: ', error.message);
        return;
      }

      if (device.name === 'ESP32' || device.name === 'SensorTag') {
        this.info('Connecting to esp32');
        this.manager.stopDeviceScan();
        device
          .connect()
          .then(device => {
            this.info('Discovering services and characteristics');
            return device.discoverAllServicesAndCharacteristics();
          })
          .then(device => {
            this.info('Setting notifications');
            this.device = device;
            return this.setupNotifications(device);
          })
          .then(() => {
              this.info('Listening...');
            },
            error => {
              this.info('Error: ', error.message);
              console.error('Error: ', error.message);
            },
          );
      }
    });
  }

  scanForDevices() {
    Alert.alert('Scanning for devices');

    this.manager.startDeviceScan(null, null, (error, device) => {
      Alert.alert('startDeviceScan');
      // if (error) {
      //   this.error(error.message);
      //   return;
      // }

      // console.log('device: ', device);
      // console.log(device.name);
      return;
    });
  }

  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Button
          style={{top: 50}}
          title="Scan For Devices"
          onPress={() => this.scanAndConnect()}
        />
        <Text style={{fontSize: 50, paddingTop: 50}}>{this.state.info}</Text>
        <Text style={{fontSize: 50}}>{this.state.message}</Text>
        {/* {Object.keys(this.sensors).map((key) => {
          return (
            <Text key={key}>
              {this.sensors[key] +
                ': ' +
                (this.state.values[this.notifyUUID(key)] || '-')}
            </Text>
          );
        })} */}
        <Button style={{top: 50}} title="On" onPress={() => this.on()} />
        <Text>{'\n\n'}</Text>
        <Button style={{top: 50}} title="Off" onPress={() => this.off()} />
        <Text>{'\n\n'}</Text>
        <Button
          style={{top: 50}}
          title="fetch val"
          onPress={() => this.fetchValue()}
        />
        <Text>
          {this.device
            ? '\n\n' + this.device.name + '\n\n'
            : '\n\n no device detected\n\n'}
        </Text>
        <Button
          style={{top: 50}}
          title="Disconnect"
          onPress={() => this.disconnect()}
        />
      </View>
    );
  }
}

export default BM;
