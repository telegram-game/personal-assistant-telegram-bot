# Personal assistant platform
* *Platform name:* Personal assistant
* *Framework:* NestJS (nodejs), FastAPI, uvicon (python3)
* *DatabaseORM:* Prisma
* *Queue:* Redis queue based

## Coding challenge
Design, create and deploy the personal assistant platform within 1 week. The workload has spent:
* Around `1 hour` to do the design in the draw.ai
* Around `10 hours` to complete the implementation.
* Around `1 hour` to adjust the confirugation for the AI model.
* Around `3 hours` to define the way to deploy, create the environment, create the docker-compose file and deploy the platform.

**=> Total 15 hours have been spent for this platform.**

### Pre-condtion
* Already have the nodejs structure (the self code based), so didn't spend time to create the platform code based.
* Already done the SPIKE via understanding clearly the AI guide line. Refer: https://github.com/rasbt/LLM-workshop-2024


## Architecture overview
![Architecture overview](https://raw.githubusercontent.com/telegram-game/personal-assistant-telegram-bot/refs/heads/main/documents/images/suggestion-simple-deployment-architecture.jpg)
*Note: It's just the simple architecture using VM instances. Can extend with the k8s cluster as well*

## Main flows
### Provide data train flow
![Provide data train flow](https://raw.githubusercontent.com/telegram-game/personal-assistant-telegram-bot/refs/heads/main/documents/images/provide-train-data-flow.jpg)
#### Explaination
* An user will provide the train data using `/ask` command via telegram.
* Telegram bot service receive the command, and make the request to the data service.
* The data service will validate the request (to train service) and then add the command to the queue.
* The event from queue will be consumed by the data consumer service and make the request to the data service to process (internal endpoint).
* Based on the command data, again, the data service will store the command to the queue and send the message to approver for the approval.

### Approve flow
![Approve flow](https://raw.githubusercontent.com/telegram-game/personal-assistant-telegram-bot/refs/heads/main/documents/images/approve-flow.jpg)
#### Explaination
* An approver will review and approve the train data via replying to the approved message from the platform.
* Same as the provide data flow, the telegram bot will validate the approvers (have to be in the approver list) and then make the request to the data service.
* Again the data service will send the message to the queue.
* The data consumer service receive the message and make the request to the data service.
* The data service will create the train data (with the `PENDING` status) and send the message to the data provider that your train data has been approved.

### Start train flow
![Start train flow](https://raw.githubusercontent.com/telegram-game/personal-assistant-telegram-bot/refs/heads/main/documents/images/start-train-flow.jpg)
#### Explaination
* To start training new model based on the train data as `PENDING` status, the approver make an `/start_train` command in the approval group.
* Like the behavior in the approve flow, the telegram bot will validate the command come from which user. If it's valid, will send the request to the data service.
* The queue process like the flows above (skip explain it). The data service will create the new `AIModel` and add the train event to the queue.
* The train service receive the event, do the process (call to the data service will get the data, make the train as completed).
* When receive the completed signal from the train service, it will update the `AIModel` to `DONE` and send the signal to the prediction service to reload new model.
* Receive the reload signal from the data service, the prediction service reload the new AI model as well.

### Ask flow
![Ask flow](https://raw.githubusercontent.com/telegram-game/personal-assistant-telegram-bot/refs/heads/main/documents/images/ask-flow.jpg)
#### Explaination
* To ask the platform somethings, the user in the group (that the bot is admin and can interact with the messages), the user can make the ask command via sending `/ask <message>`.
* The telegram bot will forward request to the data service.
* The queue process like the flows above (skip explain it). The data service will send an event to the queue to ask prediction service predict the result.
* Receive the prediction event from the queue, the prediction service will run with the current AI model, have the result and send to the data service.
* By receving the result from the prediction service, the data service will be send the response to the user via replying the message in the chat to the user.

## Source code structure
```
├── client (for frontend website)
├── deployment-config
├── scripts
├── README.md
├── nest-cli.json
├── yarn.lock
├── package.json
├── prisma
├── python_src
├── src
│   ├── app.module.ts
│   ├── main.ts
│   ├── config
│       ├── configuration.ts
│       └── validation.ts
│   ├── constants (for service constants)
│   ├── decorators (for some decorators)
│   ├── exceptions (exception modoles)
│   ├── filters (middleware for error handler)
│   ├── interceptors (service interceptors)
│   ├── interfaces (for the service interfaces)
│   ├── middlewares (service middlewares)
│   ├── models (some service common models)
│   ├── modules
│       ├── health
│       ├── http
│       ├── loggers
│       ├── prisma (prisma service)
│       ├── shared (the folder to define the shared services)
│       └── ... (domain modules)
│   ├── types
│   ├── utils
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── migrations.sh
├── Dockerfile
└── tsconfig.json
```

## ENV(s)
### Common configuration
|Name|Description|Default value|
|---|---|---|
|ENVIRONMENT| The environment of the server(local,development,qa,staging,prodution)|local|
|TZ|The timezone of the service|UTC|
|LOG_LEVEL|The log level of the service (error,warn,debug,info)|info|
|PORT|The service port|3000|

### The Telegram Bot Service
|Name|Description|Default value|
|---|---|---|
|APP_NAME=**TELEGRAM_BOT_SERVICE**|The specific app name|TELEGRAM_BOT_SERVICE|
|DATA_SERVICE_URL|The data service url|http://localhost:4002|
|TELEGRAM_TOKEN| The telegram bot token ||
|APPROVE_CHAT_ID| The telegram approve group id ||
|ADMIN_USERNAMES| The list of approver (separate by comma) ||

### The Data Service
|Name|Description|Default value|
|---|---|---|
|APP_NAME=**DATA_SERVICE**|The specific app name|DATA_SERVICE|
|POSTGRESQL_USER| user of postgres db||
|POSTGRESQL_PASSWORD| password of postgres db||
|POSTGRESQL_HOST| host of postgres db||
|POSTGRESQL_DB| postgres db||
|POSTGRESQL_PORT| port of postgres db||
|REDIS_MODE| client or cluster|client|
|REDIS_HOST| client redis host|localhost|
|REDIS_PORT| client redis port|6379|
|APPROVE_CHAT_ID| The telegram approve group id ||
|TELEGRAM_BOT_SERVICE_URL| The telegram bot service url |http://localhost:4001|
|DATA_SERVICE_URL| The data service url |http://localhost:4002|
|PREDICTION_SERVICE_URL| The prediction service url |http://localhost:4004|
|TRAIN_SERVICE_URL| The train service url |http://localhost:4005|

### The Data consumer Service
|Name|Description|Default value|
|---|---|---|
|APP_NAME=**DATA_CONSUMER**|The specific app name|DATA_CONSUMER|
|REDIS_MODE| client or cluster|client|
|REDIS_HOST| client redis host|localhost|
|REDIS_PORT| client redis port|6379|
|DATA_SERVICE_URL| The data service url |http://localhost:4002|

### The Prediction Service
|Name|Description|Default value|
|---|---|---|
|APP_NAME=**PREDICTION_SERVICE**|The specific app name|PREDICTION_SERVICE|
|REDIS_MODE| client or cluster|client|
|REDIS_HOST| client redis host|localhost|
|REDIS_PORT| client redis port|6379|
|DATA_SERVICE_URL| The data service url |http://localhost:4002|

### The Train Service
|Name|Description|Default value|
|---|---|---|
|APP_NAME=**TRAIN_SERVICE**|The specific app name|TRAIN_SERVICE|
|REDIS_MODE| client or cluster|client|
|REDIS_HOST| client redis host|localhost|
|REDIS_PORT| client redis port|6379|
|DATA_SERVICE_URL| The data service url |http://localhost:4002|

## How to install dependencies
### Requeire environment
* Nodejs (Version > 20)
* Python3 (Version > 3.9) with the pip installation

### For dev
```
$ yarn install
$ pip install -f requirements.txt
```
### For production
```
$ yarn install --frozen-lockfile 
$ pip install --no-cache-dir -r requirements.txt
```

### How to create/ apply new migration
#### Create new migration
```
$ set -o allexport && source .env
$ ./scripts/create-migration.sh <migration_name>
```
Note: In case don't have `.env` file, please clone from `.env.example` and set correct environment variables.

####  Apply the migration
```
$ set -o allexport && source .env
$ ./scripts/migration.sh
```
Note: Please setup the `DATABASE_URL` point to the database engine we want to migrate

## How to run the service
* Copy the `.env.example` to `.env` and config the env environment
* Install the dependencies
* Install prisma client 
    ```
    $ npx prisma generate
    ```
* Run the command to run the service
    ```
    $ yarn start:dev
    ```
* Run the command to run the Telegram bot service
    ```
    $ yarn start:dev:telegram-bot
    ```
* Run the command to run the data service
    ```
    $ yarn start:dev:data
    ```
* Run the command to run the data consumer service
    ```
    $ yarn start:dev:data-consumer
    ```
* Run the command to run the prediction service
    ```
    $ yarn start:dev:prediction
    ```
* Run the command to run the train service
    ```
    $ yarn start:dev:train
    ```

### Run in container (docker-compose) for whole system
```
# To up the system
$ docker-compose up --build -d
# To down the system
$ docker-compose down
```
*Note:* 
* This step require docker and docker compose installation
* Clone from docker-comple.example.yml and set correct environment variables.

## Demo
### Provide data train message
![Provide data train message](https://raw.githubusercontent.com/telegram-game/personal-assistant-telegram-bot/refs/heads/main/documents/images/train-message.jpg)
*Note:* The reply message will be sent after the train data is approved.

### Approve message
![Approve message](https://raw.githubusercontent.com/telegram-game/personal-assistant-telegram-bot/refs/heads/main/documents/images/approve-message.jpg)
*Note:* Approve via replying the approved message from the bot.

### Start train message
![Start train message](https://raw.githubusercontent.com/telegram-game/personal-assistant-telegram-bot/refs/heads/main/documents/images/start-train-message.jpg)

### Ask message
![Ask message](https://raw.githubusercontent.com/telegram-game/personal-assistant-telegram-bot/refs/heads/main/documents/images/ask-message.jpg)
