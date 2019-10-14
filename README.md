<img src="https://github.com/RHEAGROUP/CDP4-SDK-Community-Edition/raw/master/CDP-Community-Edition.png" width="250">

The Concurrent Design Platform Software Development Kit is a Typescript SDK that is compliant with ECSS-E-TM-10-25A Annex A and Annex C, available in the Community Edition under the [GNU LGPL](https://www.gnu.org/licenses/lgpl-3.0.en.html).

This repository contains example projects that demonstrate how the SDK can be used.
The source code of the SDK can be found [here](https://github.com/RHEAGROUP/CDP4-SDKTs-Community-Edition).

# Running the sample application
This sample application is based on Angular8 framework. Before running the application it is necessary to install some dependencies:
* install Node.js (please install from [here](https://nodejs.org/en/download/) and check that it is successfully installed by executing `node -v` and `npm -v`)
* install [Angular CLI](https://cli.angular.io/) by executing:

`npm install -g @angular/cli`

* enter the project's folder
* install project's dependencies:

`npm install`

* run the application:

`npm start`

Sample application should be up and running on `http://localhost:4200`.

NOTES:
* default test server is accessible on `https://cdp4services-test.rheagroup.com`
* default credentials for this server - username: admin, password: pass
* if you would like to use it with another server than please update the URL in `proxy.config.json` file. 
It is required, because the application is served on the Angular's test server and all requests should be forwarded
to the "real" server
