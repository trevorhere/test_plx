/* eslint-disable quotes */
import React, {Component} from 'react';
import {BleManager} from 'react-native-ble-plx';
import base64 from 'react-native-base64';

import {View, Button, Alert, Text} from 'react-native';

class BM extends Component {
  constructor(props) {
    super(props);
    this.manager = new BleManager();
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

  componentDidMount() {
   // Alert.alert('BLE Manager mounted');
  }

  info(message) {
    this.setState({info: message});
  }

  error(message) {
    this.setState({info: 'ERROR: ' + message});
  }

  updateValue(key, value) {
    const decodedVal = base64.decode(value);
    console.log('value', decodedVal);
   
      this.setState({
        message: decodedVal,
    });
    // this.setState({values: {...this.state.values, [key]: value}});
  }

  async setupNotifications(device) {
    for (const id in this.sensors) {
      const service = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'; //this.serviceUUID(id);
      const characteristicW = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'; // this.writeUUID(id);
      const characteristicN = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'; // this.notifyUUID(id);

      const characteristic = await device.writeCharacteristicWithResponseForService(
        service,
        characteristicW,
        'AQ==' /* 0x01 in hex */,
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
      </View>
    );
  }
}

export default BM;
