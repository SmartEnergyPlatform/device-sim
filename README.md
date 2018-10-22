Tool to simulate devices.

To isolate the user-code the npm listed library vm2 is used.

## Ports
* 5683: port for the coap-endpoints
* 8080: port for the rest-endpoints
* 3000: port for the management api and gui

## NPM
#### Build
```bash
npm install
```

#### Use
```bash
npm start
```

## Docker

#### Build
```bash
sudo docker build -t devicesim2 .
```

#### Use
```bash
sudo docker run --name ds2 -p 8080:8080 -p 80:3000 -p 5683:5683 --e "MONGO=mongodb://172.17.0.1" devicesim2
```


## Protocols

### REST-CLIENT
pushes data to a remote location/resource

#### Parameter
* method: HTTP-Method which is used for the request (only methods with payload)
* url: URL which is used for the request
* headers: headers key-value map; is optional

#### JSON Example
```json
{
    "type": "REST-CLIENT",
    "conf": {
        "method": "POST",
        "url": "http://localhost:8081/test/test",
        "headers": {}
    }
}
```

### COAP-CLIENT
pushes data to a remote location/resource

#### Parameter
* method: HTTP-Method which is used for the request (only methods with payload)
* url: URL which is used for the request
* headers: headers key-value map; is optional
* confirmable: does the request needs a ack response? is optional (appears to be ignored by the library --> every time true)

#### JSON Example
```json
{
    "type": "COAP-CLIENT",
    "conf": {
        "method": "POST",
        "url": "coap://localhost:8081/test/test",
        "headers": {},
        "confirmable": false
    }
}
```

### REST-SERVER
* sensors: creates endpoint on rest port (default 8080) over which the data can be requested
* actuators: creates endpoint on rest port (default 8080) to which commands can be send that changes the state of a resource. the current state of the recourse can be read on the same path with the GET method. 

#### Parameter
* method: method which is accepted for requests to this device (for actuators: only methods with payload)
* path: path of the endpoint

#### JSON Example
```json
{
    "type": "REST-SERVER",
    "conf": {
        "method": "GET",
        "path": "/test/test"
    }
}
```

### COAP-SERVER
* sensors: creates endpoint on coap port (default 5683) over which the data can be requested
* actuators: creates endpoint on coap port (default 5683) to which commands can be send that changes the state of a resource. the current state of the recourse can be read on the same path with the GET method. 

#### Parameter
* method: method which is accepted for requests to this device (for actuators: only methods with payload)
* path: path of the endpoint

#### JSON Example
```json
{
    "type": "COAP-SERVER",
    "conf": {
        "method": "GET",
        "path": "/test/test"
    }
}
```

