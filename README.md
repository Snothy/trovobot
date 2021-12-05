# A simple library for creating Trovo chat bots

## About
This library is a simple wrapper around Trovo's API, designed to make building chat bots for Trovo easier. <br />
I've contacted admins at Trovo regarding making improvements to their API. For more on this, scroll to the bottom.

For an example usage of this library, check out: https://github.com/Snothy/trovobot-template.

## Requirements
Node.js. <br />
Only tested on `Node v17.0.0+`. <br />

## Installation
Use `npm install trovobot` or `npm i trovobot`. <br />
Currently, the only dependencies are `ws` & `puppeteer`. <br />
Making use of puppeteer because Trovo's API requires OAuth2.0 authentication.

## Usage
Importing the library & creating an instance of the client.
```
const {Client, Scopes} = require('trovobot');
const client = new Client(settings, {
  scopes: [
    Scopes.send_to_my_channel,
    Scopes.chat_send_self,
    Scopes.manage_messages
  ],
  prefix: "!",
  headless: true
});
```
Where `settings` is a required object containing the following information: 
```
  {
    login:         object. - Login details for bot account. Required to authorize the scopes for the application.
    {
      username:    string -  username
      password:    string -  password
    }
    client_id:     string -  Your application's client_id.
    client_secret: string -  Your application's client_secret.
    chat_username: string -  The chat you want to connect to - The username of the account.
  }
```
Everything else is optional & has a default value. There are more optional properties, which have been documented & should be visible when creating the client object.<br />
Once this is done, you can initiate the authorization procedure. The init client method is asynchronous, so wrap the code in an async function or use node's top-level await functionality.
```
(async () => {
  await client.init();

  client.on(message => {
    // Handle message event
  });
})();
```
In `client.on(message => ...)`, the callback function listens for new messages in the chat and returns them as an object. Its properties are documented and should be visible in any modern IDE.


There's many different types of messages. I have summed them up in `./utils/typeConversion.js` & they're available in `client.types` as an object. <br /> 
You can read up on this in Trovo's API docs: https://developer.trovo.live/docs/Chat%20Service.html#_1-introduction <br /> <br />

## Scopes
You must allow the application on two accounts. The account which acts as the bot, and the account in which's chat the bot will be running in (chat_username). As the chat accounts needs to give the application permissions to perform actions in the chat. <br />
Because all scope authentication is performed through OAuth2.0, when there are new scopes that need to be allowed for the bot account, a prompt (browser window with trovo's OAuth login page) will appear for the user to log in and allow the scopes for the application from the chat account. <br/>
This is required every time you add new scopes. If no change (addition) has been made, it will automatically perform the initialization with no prompt.<br/>
This keeps both accounts synced by allowing the application for the same scopes. If any issues occur where one account has given it different permissions, refer to the FAQ to see how to reset scope permissions. <br/>

## FAQ
1. How do I get a client_id & client_secret?
   - You have to create an application on Trovo's developer portal. Once your application is approved, you will be granted access to make requests to their API using your credentials.
   - Link to developer portal: https://developer.trovo.live/
   - Once your application is approved (may take up to 2 weeks), you will have access to this: <br />
   ![Trovo application](https://i.imgur.com/1yy9GVl.png)
2. Why is the bot unable to send any messages in my chat?
   - You need to authorize the application with the appropriate scopes.
   - To send chat messages, the required scopes are: send_to_my_channel & chat_send_self.
   - The client methods have their required scopes documented, but you can also refer to trovo's documentation (trovo developer portal).
3. How can I reset the scopes of an application (remove an application) from my account?
   - Go into your account settings
   - Permissions -> Apps with access to your Trovo account
   - Discconnect your application
   - Recommended to do this from both the bot and chat accounts

## Issues
 - The init method sometimes fails to load the page on time.
 - ..probably some other issues

## Future plans 
 - Making the `client.init()` method more consistent.
 - Error handling.
 - Automated testing.
 - More documentation.
 - Cover more of Trovo's API

## Improving Trovo's API
1. Fixed a broken API method
   - I contacted Trovo about an issue with their 'Search Category` method, as it, according to chat logs in the API discussions thread on their Discord, hadn't been functional for months. This led to them fixing it and me using it.
2. Improving the login / authentication, so it does not require a browser
   - While I'm aware their authentication for scopes currently depends on OAuth2.0, I have asked them to provide a method to authorize through POST. Would make writing applications with no GUI a lot easier to code. If this is possible and does get implemented, I will update the authentication methods.