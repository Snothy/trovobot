# trovobot - A simple library for creating Trovo chat bots

## About
This library is a simple wrapper around Trovo's API, designed to make building chat bots for Trovo easier. <br />
I have been in talks with administrators at Trovo regarding making improvements to their API. For more on this, scroll to the bottom.

For an example usage of this library, check out: https://github.com/Snothy/trovobot_template.

## Requirements
Node.js and npm. <br />
Only tested on `Node v17.0.0+`. <br />

## Installation
Use `npm install trovobot` or `npm i trovobot`. <br />
Currently, the only dependencies are `ws` & `puppeteer`. <br />
Making use of puppeteer because Trovo's API does not provide a method to authenticate with a POST request. It seems to have been designed for applications with a GUI.

## Usage
Importing the library & creating an instance of the client.
```
const trovobot = require('trovobot');
const client = new trovobot.Bot(settings);
```
Where `settings` is an object containing the following information: 
```
  {
    prefix:        string -  Reccommended 1 special character. This is the trigger for the bot commands.

    login:         object. - Login details for bot account. Required to authorize the scopes for the application.
    {
      username:    string -  username
      password:    string -  password
    }
    client_id:     string -  Your application's client_id.
    client_secret: string -  Your application's client_secret.
    chat_username: string -  The chat you want to connect to - The username of the account.

    headless:      bool   -  Whether puppeteers browser is headless.
  }
```
Once this is done, you can initiate the authorization procedure. All client methods are asynchronous, so wrap the code in an async function.
```
(async () => {
  await client.init();
})();
```
If there are any issues with this, you can turn off the headless browser to monitor what's happening. Upon the first login, the code should automatically press "Allow" to allow the scopes for the application. Then it is redirected to the main page on trovo, where the URL contains the authorization code.

To connect to the chat you want to run the bot in:
```
(async () => {
  await client.init();

  client.on(message => {
    // Handle message event
  });
})();
```
This method listens for new chat messages and returns them as the `message` object. This object (and this is directly from Trovo's API) consists of:
```
{
    "type": "CHAT",
    "channel_info": {
        "channel_id": "<channel_id>"
    },
    "data": {
        "eid": "<eid>",
        "chats": [
            {
                "type": <message_type_id>,
                "content": "<message_txt>",
                "nick_name": "<display_name>",
                "avatar": "<profile_picture>",
                "sub_lv": "<subscription_level>",
                "sub_tier": "<subscription_tier>",
                "medals": <array_of_badges>,
                "decos": <array_of_profile_pic_decors>,
                "roles": <array_of_roles>,
                "message_id": "<message_id>",
                "sender_id": <sender_user_id>,
                "uid":<sender_user_id>,
                "user_name": "<sender_user_name>",
                "content_data":<extra_info_for_message>
            }
        ]
    }
}
```
There's many different types of messages. I have summed them up in `./utils/typeConversion.js` & they're available in `client.types` as an object. <br /> 
You can read up on this in Trovo's API docs: https://developer.trovo.live/docs/Chat%20Service.html#_1-introduction

## FAQ
1. How do I get a client_id & client_secret?
   - You have to create an application on Trovo's developer portal. Once your application is approved, you will be granted access to make requests to their API using your credentials.
   - Link to developer portal: https://developer.trovo.live/
   - Once your application is approved (may take up to 2 weeks), you will have access to this: <br />
   ![Trovo application](https://i.imgur.com/1yy9GVl.png)

## Issues
 - Have not extensively tested how consistent the code is at pressing the "Allow" button during authorization.
 - No documentation :)

## Future plans 
 - Making the `client.init()` method more consistent.
 - Documentation.
 - Cover more of Trovo's API

## Improving Trovo's API
1. Fixed a broken API method
   - I contacted Trovo about an issue with their 'Search Category` method, as it, according to chat logs in the API discussions thread on their Discord, hadn't been functional for months. This led to them fixing it and me using it.
2. Improving the login / authentication, so it does not require a browser
   - I have let them know how unintuitive their current authentication methods are and suggested they provide developers with a way to authorize through a POST request. If this does get implemented, I will update the library to use the new method.

