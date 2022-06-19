# ElastAlert Server

> A server that runs [ElastAlert 2](https://github.com/jertel/elastalert2) and exposes REST API's for manipulating rules and alerts. It works great in combination with our [ElastAlert Kibana plugin](https://github.com/karql/elastalert-kibana-plugin).

![Docker Pulls](https://img.shields.io/docker/pulls/praecoapp/elastalert-server.svg)
![GitHub stars](https://img.shields.io/github/stars/johnsusek/elastalert-server.svg?style=social&label=Stars)

**TODO**

- Update CONTRIBUTING.md
- Support OpenSearch 2.0
- Remove body-parser
- Migrate raven-node to @sentry/node
- Add TestCode
- Remove Support Elasticsearch 5, 6
- Support Elasticsearch ApiKey authentication connection
  https://github.com/elastic/elasticsearch-js/blob/main/docs/basic-config.asciidoc
- Support Elasticsearch Bearer authentication connection
  https://github.com/elastic/elasticsearch-js/blob/main/docs/basic-config.asciidoc
- Support Elastic Cloud CloudID connection
  https://github.com/elastic/elasticsearch-js/blob/main/docs/basic-config.asciidoc
- Support Elasticsearch proxy connection
  https://github.com/elastic/elasticsearch-js/blob/main/docs/basic-config.asciidoc

---

## Installation
The most convenient way to run the ElastAlert server is by using our Docker container image. The default configuration uses `localhost:9200` as ElasticSearch host, if this is not the case in your setup please edit `es_host` and `es_port` in both the `elastalert.yaml` and `config.json` configuration files.

To run the Docker image you will want to mount the volumes for configuration and rule files to keep them after container updates. In order to do that conveniently, please do: `git clone https://github.com/johnsusek/elastalert-server.git && cd elastalert-server`

```bash
docker run -d -p 3030:3030 -p 3333:3333 \
    -v `pwd`/config/elastalert.yaml:/opt/elastalert/config.yaml \
    -v `pwd`/config/config.json:/opt/elastalert-server/config/config.json \
    -v `pwd`/rules:/opt/elastalert/rules \
    -v `pwd`/rule_templates:/opt/elastalert/rule_templates \
    --net="host" \
    --name elastalert praecoapp/elastalert-server:latest
```

## Building Docker image

Clone the repository
```bash
git clone https://github.com/johnsusek/elastalert-server.git && cd elastalert-server
```

Build the image
```
make build
```
which is equivalent of
```
docker pull python:3.10-alpine3.16 && docker pull node:16.15-alpine3.16
docker build -t elastalert-server .
```

### Options

Using a custom ElastAlert 2 version (a [release from github](https://github.com/jertel/elastalert2/releases))
```bash
make build v=2.3.0
```
Using a custom mirror
```bash
docker build --build-arg ELASTALERT_URL=http://example.mirror.com/master.zip -t elastalert-server .
```

## Configuration
In `config/config.example.json` you'll find the default config. You can make a `config.json` file in the same folder that overrides the default config. When forking this repository it is recommended to remove `config.json` from the `.gitignore` file. For local testing purposes you can then use a `config.dev.json` file which overrides `config.json`.

You can use the following config options:

```javascript
{
  "appName": "elastalert-server", // The name used by the logging framework.
  "port": 3030, // The port to bind to
  "wsport": 3333, // The port to bind to for websockets
  "elastalertPath": "/opt/elastalert",  // The path to the root ElastAlert 2 folder. It's the folder that contains the `setup.py` script.
  "start": "2014-01-01T00:00:00", // Optional date to start querying from
  "end": "2016-01-01T00:00:00", // Optional date to stop querying at
  "verbose": true, // Optional, will increase the logging verboseness, which allows you to see information about the state of queries.
  "es_debug": true, // Optional, will enable logging for all queries made to Elasticsearch
  "debug": false, // Will run ElastAlert 2 in debug mode. This will increase the logging verboseness, change all alerts to DebugAlerter, which prints alerts and suppresses their normal action, and skips writing search and alert metadata back to Elasticsearch.
  "rulesPath": { // The path to the rules folder containing all the rules. If the folder is empty a dummy file will be created to allow ElastAlert 2 to start.
    "relative": true, // Whether to use a path relative to the `elastalertPath` folder.
    "path": "/rules" // The path to the rules folder. 
  },
  "templatesPath": { // The path to the rules folder containing all the rule templates. If the folder is empty a dummy file will be created to allow ElastAlert 2 to start.
    "relative": true, // Whether to use a path relative to the `elastalertPath` folder.
    "path": "/rule_templates" // The path to the rule templates folder.
  },
  "dataPath": { // The path to a folder that the server can use to store data and temporary files.
    "relative": true, // Whether to use a path relative to the `elastalertPath` folder.
    "path": "/server_data" // The path to the data folder.
  },
  "es_host": "localhost", // For getting metadata and field mappings, connect to this ES server
  "es_port": 9200, // Port for above
  "es_username": "", // Option basic-auth username and password for Elasticsearch
  "es_password": "", // Option basic-auth username and password for Elasticsearch
  "opensearch_flg": false, // OpenSearch Flg (OpenSearch or Elasticsearch-OSS is true)
  "es_ssl": true, // Enable/Disable SSL
  "ea_verify_certs": true, //  Verify TLS certificates. false for self-signed certificate
  "es_ca_certs": "/etc/ssl/elasticsearch/ca", // Path to ca for ElasticSearch (SSL must be enabled)
  "es_client_cert": "/etc/ssl/elasticsearch/cert", // Path to cert for ElasticSearch (SSL must be enabled)
  "es_client_key": "/etc/ssl/elasticsearch/key", // Path to key for ElasticSearch (SSL must be enabled)
  "writeback_index": "elastalert_status", // Writeback index to examine for /metadata endpoint
  "prometheus_port": 9979 // Port for Prometheus
}
```

ElastAlert 2 also expects a `elastalert.yaml` with at least the following options.
```yaml
# The elasticsearch hostname for metadata writeback
# Note that every rule can have its own elasticsearch host
es_host: localhost

# The elasticsearch port
es_port: 9200

# The index on es_host which is used for metadata storage
# This can be a unmapped index, but it is recommended that you run
# elastalert-create-index to set a mapping
writeback_index: elastalert_status

# This is the folder that contains the rule yaml files
# Any .yaml file will be loaded as a rule
rules_folder: rules

# How often ElastAlert 2 will query elasticsearch
# The unit can be anything from weeks to seconds
run_every:
  seconds: 5

# ElastAlert 2 will buffer results from the most recent
# period of time, in case some log sources are not in real time
buffer_time:
  minutes: 1
```
 
## API
This server exposes the following REST API's:

- **GET `/`**

    Exposes the current version running
  
- **GET `/status`**

    Returns either 'SETUP', 'READY', 'ERROR', 'STARTING', 'CLOSING', 'FIRST_RUN' or 'IDLE' depending on the current ElastAlert 2 process status. 
  
- **[WIP] GET `/status/errors`**

    When `/status` returns 'ERROR' this returns a list of errors that were triggered.
  
- **GET `/rules`**

    Returns a list of directories and rules that exist in the `rulesPath` (from the config) and are being run by the ElastAlert 2 process. Pass query parameter `all` to return a list of all rules in all directories.
  
- **GET `/rules/:id`**

    Where `:id` is the id of the rule returned by **GET `/rules`**, which will return the file contents of that rule.
  
- **POST `/rules/:id`**

    Where `:id` is the id of the rule returned by **GET `/rules`**, which will allow you to edit the rule. The body send should be:
  
      ```javascript
      {
        // Required - The full yaml rule config.
        "yaml": "..."
      }
      ```
    
- **DELETE `/rules/:id`**

    Where `:id` is the id of the rule returned by **GET `/rules`**, which will delete the given rule.

- **GET `/templates`**

    Returns a list of directories and templates that exist in the `templatesPath` (from the config) and are being run by the ElastAlert 2 process.
  
- **GET `/templates/:id`**

    Where `:id` is the id of the template returned by **GET `/templates`**, which will return the file contents of that template.
  
- **POST `/templates/:id`**

    Where `:id` is the id of the template returned by **GET `/templates`**, which will allow you to edit the template. The body send should be:
  
      ```javascript
      {
        // Required - The full yaml template config.
        "yaml": "..."
      }
      ```
    
- **DELETE `/templates/:id`**

    Where `:id` is the id of the template returned by **GET `/templates`**, which will delete the given template.
  
- **PUT `/folders/:type/:path`**

    Create the folder at the specified path within the :type directory, either `rules` or `templates`.

- **DELETE `/folders/:type/:path`**

    Delete the folder at the specified path within the templates directory. Trying to delete a non-empty directory will return an error.

- **POST `/silence/:id`**

    Where `:id` is the id of the rule returned by **GET `/rules`**, which will allow you to silence the rule. The body to send should be:
  
      ```javascript
      {
        // The unit, one of 'seconds', 'minutes', 'hours', 'days', 'weeks'.
        "unit": "..."
        // The duration, an integer.
        "duration": "..."
      }
      ```

- **POST `/test`**

    This allows you to test a rule. The body to send should be:
  
      ```javascript
      {
        // Required - The full yaml rule config.
        "rule": "...",
        
        // Optional - The options to use for testing the rule.
        "options": {
        
          // Can be either "all", "schemaOnly" or "countOnly". "all" will give the full console output. 
          // "schemaOnly" will only validate the yaml config. "countOnly" will only find the number of matching documents and list available fields.
          "testType": "all",
          
          // Can be any number larger than 0 and this tells ElastAlert 2 over a period of how many days the test should be run
          "days": "1",      
              
          // Overrides 'days' option to specify exact time period to test
          "start": '2018-10-28T08:30:00.000Z',
          "end": '2018-10-28T10:30:00.000Z', // or 'NOW'
          
          // Whether to send real alerts
          "alert": false,

          // Return results in structured JSON
          "format": "json",

          // Limit returned results to this amount
          "maxResults": 1000
        }
      }
      ``` 

- **WEBSOCKET `/test`**
    
    This allows you to test a rule and receive progress over a websocket. Send a message as JSON object (stringified) with two keys: `rule` (yaml string) and `options` (JSON object). You will receive progress messages over the socket as the test runs.

- **GET `/metadata/:type`**

    Returns metadata from elasticsearch related to elasalert's state. `:type` should be one of: elastalert_status, elastalert, elastalert_error, or silence. See [docs about the elastalert metadata index](hhttps://elastalert2.readthedocs.io/en/latest/elastalert_status.html).

- **GET `/mapping/:index`**

    Returns field mapping from elasticsearch for a given index. 

- **GET `/indices`**

    Returns a list of indices from elasticsearch. 

- **GET `/search/:index`**

    Performs elasticsearch query on behalf of the API. JSON body to this endpoint will become body of an ES search. 

- **GET `/config`**

    Gets the `run_every` and `buffer_time` settings from the ElastAlert 2 configuration in `config.yaml` at `elastalertPath` (from the config).
  
- **[WIP] POST `/config`**

    Allows you to edit the ElastAlert 2 configuration from `config.yaml` in `elastalertPath` (from the config). The required body to be send will be edited when the work on this API is done.
        
## Contributing
Want to contribute to this project? Great! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting an issue or a pull request.

**We only accept pull requests on our [GitHub repository](https://github.com/johnsusek/elastalert-server)!**
 
## Contact
We'd love to help you if you have any questions. You can contact us by using the [contact info on our website](https://github.com/johnsusek/praeco).
 
## License
This project is [BSD Licensed](../LICENSE.md) with some modifications. Note that this only accounts for the ElastAlert Server, not ElastAlert 2 itself ([ElastAlert 2 License](https://github.com/jertel/elastalert2/blob/master/LICENSE)).

## Disclaimer
We [(BitSensor)](https://www.bitsensor.io) do not have any rights over the original [ElastAlert 2](https://github.com/jertel/elastalert2) project from [jertel](https://github.com/jertel/). We do not own any trademarks or copyright to the name "ElastAlert 2" (ElastAlert 2, however, does because of their Apache 2 license). We do own copyright over the source code of this project, as stated in our BSD license, which means the copyright notice below and as stated in the BSD license should be included in (merged / changed) distributions of this project. The BSD license also states that making promotional content using 'BitSensor' is prohibited. However we hereby grant permission to anyone who wants to use the phrases 'BitSensor ElastAlert Plugin', 'BitSensor Software' or 'BitSensor Alerting' in promotional content. Phrases like 'We use BitSensor' or 'We use BitSensor security' when only using our ElastAlert Server are forbidden.

## Copyright
Copyright © 2018, BitSensor B.V.
All rights reserved.
