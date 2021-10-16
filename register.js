const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
var config = require("./config.json");

const commands = [
  {
    name: "set-preferences",
    description: "Sets your preferences for features this bot offers.",
    options: [
      {
        name: "auto-kick-new-accounts",
        description:
          "If a user joins whose account has been created within the past week, automatically kick them.",
        type: 2, // 2 is type SUB_COMMAND_GROUP
        options: [
          {
            name: "enable",
            description: "Enables the auto-kick feature",
            type: 1 // 1 is type SUB_COMMAND
          },
          {
            name: "disable",
            description: "Disables the auto-kick feature",
            type: 1
          }
        ]
      },
      {
        name: "auto-assign-roles",
        description:
          "When a user joins the guild, assign them one of the roles from 'give-everyone-a-role' command.",
        type: 2, // 2 is type SUB_COMMAND_GROUP
        options: [
          {
            name: "enable",
            description: "Enables the auto-assign-role feature",
            type: 1 // 1 is type SUB_COMMAND
          },
          {
            name: "disable",
            description: "Disables the auto-assign-role feature",
            type: 1
          }
        ]
      }
    ]
  },
  {
    name: "get-preferences",
    description:
      "Displays your stored preferences for features this bot offers."
  },
  {
    name: "kick-new-accounts",
    description:
      "Will kick all accounts from the server that are newer than the number of days you send.",
    options: [
      {
        name: "days",
        description:
          "How many days old the account must be in order to NOT be kicked.",
        type: 4,
        required: true
      }
    ]
  },
  {
    name: "give-everyone-a-role",
    description:
      "Will give all accounts on the server a random role from the list of roles you pass in. (up to 5)",
    options: [
      {
        name: "role-1",
        description: "One of the roles that will be randomly assigned",
        type: 2
      },
      {
        name: "role-2",
        description: "One of the roles that will be randomly assigned",
        type: 2
      },
      {
        name: "role-3",
        description: "One of the roles that will be randomly assigned",
        type: 2
      },
      {
        name: "role-4",
        description: "One of the roles that will be randomly assigned",
        type: 2
      },
      {
        name: "role-5",
        description: "One of the roles that will be randomly assigned",
        type: 2
      }
    ]
  }
];

const rest = new REST({ version: "9" }).setToken(config.token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(config.clientId), {
      body: commands
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
