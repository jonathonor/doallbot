/*
  doallbot, a bot that takes different actions on all members of a server
*/

import { join, dirname } from "path";
import { Low, JSONFile } from "lowdb";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter);

let config = process.env;
import { Client, Intents, InteractionCollector } from "discord.js";
import axios from "axios";
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_BANS
  ]
});

db.read();

db.data = db.data || [
  {
    id: "240539870873911296",
    preferences: {
      "auto-kick-new-accounts": false,
      "auto-assign-roles": false,
      "auto-assign-prefix": false
    }
  }
];

client.on("ready", () => {
  console.log(`doallbot ready!`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  if (!interaction.guildId) {
    interaction.reply(
      "This command is not available through DM, please send it in a guild channel."
    );
    return;
  }

  if (verifyUser(interaction)) {
    let guildExists = db.data.find(a => a.id === interaction.guildId);

    if (!guildExists) {
      db.data.push({
        id: interaction.guildId,
        preferences: {
          "auto-kick-new-accounts": false,
          "auto-assign-roles": false,
          "auto-assign-prefix": false
        },
        storedData: []
      });
      await db.write();
    }

    if (interaction.commandName === "kick-new-accounts") {
      iterateThroughMembers(interaction, kickYoungAccount, kickCallback);
      let p = db.data.find(a => a.id === interaction.guild.id).preferences;
      p.days = interaction.options.data.find(obj => obj.name === "days").value;
      await db.write();
    } else if (interaction.commandName === "give-roles") {
      iterateThroughMembers(interaction, assignRole, roleCallback);
      let p = db.data.find(a => a.id === interaction.guild.id).preferences;
      p.assignableRoles = interaction.options.data.map(r => {
        return { name: r.role.name, id: r.value };
      });
      await db.write();
    } else if (interaction.commandName === "give-prefixes") {
      iterateThroughMembers(interaction, addPrefix, prefixCallback);
      let p = db.data.find(a => a.id === interaction.guild.id).preferences;
      let prefix = interaction.options.data.find(a => a.name === "prefix");
      p.assignablePrefix = prefix ? prefix.value : "";
      await db.write();
    } else if (interaction.commandName === "get-preferences") {
      respondToInteraction(
        interaction,
        JSON.stringify(
          db.data.find(a => a.id === interaction.guildId).preferences
        )
      );
    } else if (interaction.commandName === "set-preferences") {
      let p = db.data.find(a => a.id === interaction.guild.id).preferences;
      p[
        interaction.options._hoistedOptions.find(
          a => a.name === "feature"
        ).value
      ] =
        interaction.options._hoistedOptions.find(
          a => a.name === "enable-or-disable"
        ).value === "enable"
          ? true
          : false;
      await db.write();
      respondToInteraction(
        interaction,
        JSON.stringify(
          db.data.find(a => a.id === interaction.guild.id).preferences
        )
      );
    } else if (interaction.commandName === "store-data") {
      let dbData = db.data.find(a => a.id === interaction.guild.id).storedData;
      let dataId = interaction.options.data.find(a => a.name === "data-name").value;
      console.log(dataId);
      let dataValue = interaction.options.data.find(
        a => a.name === "data-value"
      ).value;
      let currentValue =
        dbData.find(a => a.id === interaction.user.id) &&
        dbData.find(a => a.id === interaction.user.id)[dataId]
          ? dbData.find(a => a.id === interaction.user.id)[dataId]
          : null;

      if (currentValue) {
        interaction.reply(
          `You have already stored data for ${dataId}, current value is '${currentValue}', contact the server owner if you need to change the value.`
        );
      } else {
        let dataToStore = { id: interaction.user.id};
        dataToStore[dataId] = dataValue;
        console.log(dataToStore, dataId, dataValue);
        dbData.push(dataToStore);
        interaction.reply(
          `You have just stored data for ${dataId}, I set the value as '${dataValue}'`
        );
      }
      await db.write();
    }
  } else {
    respondToInteraction(
      interaction,
      `Only server owners have the ability to use that command...`
    );
  }
});

// When a new user joins your server, check preferences of the server, and do actions as preferences desire.
client.on("guildMemberAdd", async addedMember => {
  let guildData = db.data.find(a => a.id === addedMember.guild.id);
  let preferences = guildData.preferences;

  if (preferences["auto-kick-new-accounts"]) {
    if (preferences.assignableDays) {
      var lastWeek = new Date();
      var pastDate = lastWeek.getDate() - preferences.assignableDays;
      lastWeek.setDate(pastDate);
      if (addedMember.user.createdTimestamp > lastWeek)
        addedMember.createDM().then(dmChannel => {
          dmChannel
            .send(
              `The server you just tried to join has restrictions in place, your account must be older than one week in order to join.`
            )
            .then(() => {
              addedMember.kick(
                `Kicked ${addedMember.user.username}, Account created at ${addedMember.user.createdAt}`
              );
            });
        });

      console.log(
        `Kicked new member ${addedMember.user.username} - account created: ${addedMember.user.createdAt}`
      );
    }
  }
  if (preferences["auto-assign-roles"]) {
    let rolesToAssign = preferences.assignableRoles;
    if (rolesToAssign) {
      let randomNumber = Math.floor(Math.random() * rolesToAssign.length);
      let randomRole = rolesToAssign[randomNumber];

      addedMember
        .createDM()
        .then(dmChannel => {
          dmChannel.send(
            `The server you just joined assigned you the role: ${randomRole.name}`
          );
        })
        .then(() => {
          addedMember.roles.add(randomRole.id);
        });
    }
  }
  if (preferences["auto-assign-prefix"]) {
    let prefix = preferences.assignablePrefix;
    if (prefix) {
      let prefixedName = `${prefix} ${addedMember.user.username}`;
      addedMember.createDM().then(dmChannel => {
        dmChannel
          .send(
            `The server you just joined assigned you the display name: ${prefixedName}`
          )
          .then(() => {
            addedMember.setNickname(prefixedName);
          });
      });
    }
  }
});

let iterateThroughMembers = (interaction, action, callback) => {
  let data = { count: 0, roles: {} };
  interaction.guild.members
    .fetch()
    .then(members => {
      for (const member of members.values()) {
        if (member.manageable) {
          data = action(member, interaction, data);
        } else {
          console.log(
            `Unable to apply action: ${action.name} to ${member.user.username}`
          );
        }
      }
      callback(interaction, data);
    })
    .catch(console.log);
};

let addPrefix = (member, interaction, data) => {
  let prefix = interaction.options.data.find(obj => obj.name === "prefix");
  let prefixVal = prefix ? prefix.value : "";
  member.setNickname(`${prefixVal} ${member.user.username}`);
  data.count++;
  return data;
};

let prefixCallback = (interaction, data) => {
  respondToInteraction(
    interaction,
    `I went through and added prefixes to ${data.count} members.`
  );
};

let assignRole = (member, interaction, data) => {
  let rolesToAssign = interaction.options.data.map(r => r.role);
  let randomNumber = Math.floor(Math.random() * rolesToAssign.length);
  let randomRole = rolesToAssign[randomNumber];

  let userHasRoleAlready = member._roles.some(roleId =>
    rolesToAssign.find(r => r.id === roleId)
  );
  if (!userHasRoleAlready) {
    if (!member.user.bot) {
      data.count++;
      data.roles[randomRole.name] > 0
        ? data.roles[randomRole.name]++
        : (data.roles[randomRole.name] = 1);
      member.roles.add(randomRole);

      console.log(`Added role: ${randomRole.name} to: ${member.displayName}`);
    }
  }
  return data;
};

let roleCallback = (interaction, data) => {
  respondToInteraction(
    interaction,
    `Added ${data.count} roles to members with numbers: ${JSON.stringify(
      data.roles
    )}`
  );
};

let kickYoungAccount = (member, interaction, data) => {
  var lastWeek = new Date();
  let dayVal = interaction.options.data.find(obj => obj.name === "days").value;
  var pastDate = lastWeek.getDate() - dayVal;

  lastWeek.setDate(pastDate);

  if (member.user.createdTimestamp > lastWeek) {
    data.count++;

    member.kick(
      `Account is too new - ${member.user.username} : Created at ${member.user.createdAt}`
    );
    console.log(
      `Kicking ${member.user.username} - account created: ${member.user.createdAt}`
    );
  }
  return data;
};

let kickCallback = (interaction, data) => {
  respondToInteraction(
    interaction,
    `I just kicked ${data.count} new accounts! See Server Settings -> Audit Log for all users kicked, and dates accounts were made.`
  );
};

// Verifies that the user who sent the command has the admin permission.
let verifyUser = interaction => {
  return interaction.memberPermissions.has("ADMINISTRATOR");
};

// Responds to each (/) slash command with outcome of the command, if this was triggered by a client event or an error, it logs the outcome to the log channel denoted in config
let respondToInteraction = async (interaction, message, error = null) => {
  let url = `https://discord.com/api/v8/interactions/${interaction.id}/${interaction.token}/callback`;

  let json = {
    type: 4,
    data: {
      content: message
    }
  };

  axios.post(url, json);

  if (error) {
    console.log(error);
  }
};

client.login(config.token);
