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
import { Client, Intents } from "discord.js";
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
      "auto-assign-roles": false
    }
  }
];

client.on("ready", () => {
  console.log(`doallbot ready!`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  if (verifyUser(interaction)) {
    let p =
      db.data.find(a => a.id === interaction.guildId) &&
      db.data.find(a => a.id === interaction.guildId).preferences;
    if (!p) {
      db.data.push({
        id: interaction.guild.id,
        preferences: {
          "auto-kick-new-accounts": false,
          "auto-assign-roles": false
        }
      });
      await db.write();
    }

    if (interaction.commandName === "kick-new-accounts") {
      iterateThroughMembers(interaction, kickYoungAccount, kickCallback);
      let p = db.data.find(a => a.id === interaction.guild.id).preferences;
      p.days = interaction.options.data.find(obj => obj.name === "days").value;
    } else if (interaction.commandName === "give-roles") {
      iterateThroughMembers(interaction, assignRole, roleCallback);
      let p = db.data.find(a => a.id === interaction.guild.id).preferences;
      p.assignableRoles = interaction.options.data.map(r => {
        return { name: r.role.name, id: r.value };
      });
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
      p[interaction.options._group] =
        interaction.options._subcommand === "enable" ? true : false;
      await db.write();
      respondToInteraction(
        interaction,
        JSON.stringify(
          db.data.find(a => a.id === interaction.guild.id).preferences
        )
      );
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
    var lastWeek = new Date();
    var pastDate = lastWeek.getDate() - 7;
    lastWeek.setDate(pastDate);
    if (addedMember.user.createdTimestamp > lastWeek)
      addedMember
        .createDM()
        .then(dmChannel => {
          dmChannel.send(
            `The server you just tried to join has restrictions in place, your account must be older than one week in order to join.`
          );
        })
        .then(() => {
          addedMember.kick(
            `Kicked ${addedMember.user.username}, Account created at ${addedMember.user.createdAt}`
          );
        });

    console.log(
      `Kicked new member ${addedMember.user.username} - account created: ${addedMember.user.createdAt}`
    );
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
});

let iterateThroughMembers = (interaction, action, callback) => {
  let data = { count: 0, roles: {} };
  interaction.guild.members
    .fetch()
    .then(members => {
      for (const member of members.values()) {
        data = action(member, interaction, data);
      }
      callback(interaction, data);
    })
    .catch(console.log);
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
      member.createDM().then(dmChannel => {
        dmChannel
          .send(
            `This server owner has assigned you the role: ${randomRole.name}`
          )
          .then(() => {
            member.roles.add(randomRole);
          });
      });

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
    member.createDM().then(dmChannel => {
      dmChannel
        .send(
          `The server owner has kicked you because your account was created less than ${dayVal} day(s) ago.`
        )
        .then(() => {
          member.kick(
            `Account is too new - ${member.user.username} : Created at ${member.user.createdAt}`
          );
        });
    });
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
