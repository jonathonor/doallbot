# doallbot

Discord bot that takes actions on all users of a guild.

Preferences: (automatically set to false when the bot joins your server)

- auto-assign-roles
- auto-kick-new-accounts
- auto-assign-prefix

Current Commands:
- /kick-new-accounts - Instantly removes all users from your server whose account is newer than todays date minus the number of days you say.
  - Note: This number of days is stored, and used to automatically kick users who join your server whose account is younger than the days specified (they are sent a message with reasoning why they were kicked)
- /give-roles - gives everyone in the server one of the random roles you pass into the command
  - Note: The roles you send in this command are stored, and are assigned randomly to new members upon join if you have the auto-assign-roles feature enabled
- /give-prefixes - gives everyone in the server the prefix you pass into the command (adds the prefix then a space to the beginning of the users username)
  - Note: The prefix you send in this command is stored, and is assigned to new members upon join if you have the auto-assign-prefix feature enabled
- /store-data data-name data-value - stores a given piece of data for the current user for the guild owner
  Current Options: (open a feature request, or send me a message for new options!)
  - wallet-id (used to store crypto wallet ids for NFT sales)
- /get-data - allows a guild owner to retrieve the data that has been stored by the guilds users
- /set-preferences feature enable-or-disable - enables or disables a given feature based on options chosen
- /get-preferences - shows what preferences you currently have set on the bot

On join auto actions:

- Kicks a user account upon joining a server if the account is less than a week old
  - Note: This does not happen unless you have the preference "auto-kick-new-accounts" enabled
  - Note: This does not happen unless you have previously ran the /kick-new-accounts command with a day value
- Automatically add a role to the user upon joining the server
  - Note: This does not happen unless you have the preference "auto-assign-roles" enabled
  - Note: This does not happen unless you have previously ran the /give-roles command with roles
- Automatically add a prefix to the user upon joining the server
  - Note: This does not happen unless you have the preference "auto-assign-prefix" enabled
  - Note: This does not happen unless you have previously ran the /give-prefixes command with a prefix

Invite this bot to your discord server!
 - Very Important! After you have invited the bot to your server, you must drag the role created by the bot above the other roles in the list if you would like to use the bot to assign any other roles.
 - [Invite the bot](https://discord.com/api/oauth2/authorize?client_id=966715722933882980&permissions=8&scope=bot%20applications.commands)

Or download the code and host it yourself!

Clone this repo to wherever you want the bot to run.

- example :
  - cd /Documents
  - git clone https://github.com/jonathonor/doallbot.git
  - cd doallbot
  - npm install discord.js @discordjs/rest discord-api-types axios
  - node register.js (this registers the /kick-them-all slash command for your server)
  - node run.js

To Create a discord dev application if you don't have one (you need the token)

1. Create a Discord Bot at https://discordapp.com/developers/applications
2. Click New Application
3. On the left hand side click Bot
4. Click Ok
5. Create a new file based on the config example json file named config.json
6. Copy Bot Token into config.json, and copy Bot Client Id into config.json
7. Scroll down and Enable Server Members Intent (so that we can see when new members join the server)
8. Click OAuth2 in the left sidebar
9. Copy the client id into the config.json
10. Click in the scopes section "bot" & "application.commands" and in the bot permissions section "administrator"
11. Copy the URL in the bottom of the "scopes" section and paste it into your web browser
12. You will need to use the url to invite the bot to your server
13. Enable discord developer mode. https://discordia.me/developer-mode
14. Copy the ID's of the server by right clicking the server nameand then clicking "Copy Id"
15. Paste the server id's into the config.json
16. IMPORTANT: Make sure the bot's role in your discord server is located above the roles you want synced in the role heirarchy. (The bots role should be the same name as what you named the bot)

Now you are ready to use the commands described at the top of this page.
