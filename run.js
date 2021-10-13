/*
    banBot, a super simple bot that gives you the ability to ban new discord account 
    until the account is older than one week old
*/

var config = require('./config.json')
const { Client, Intents } = require('discord.js');
const axios = require('axios');
const client = new Client({ intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS] });

client.on('ready', () => {
  console.log(`banbot ready!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'kick-them-all') {
        verifyUser(interaction.member.id).then(async verified => {
            if (verified) {
                kickEm(interaction);
            } else {
                respondToInteraction(interaction, `You dont have the necessary role to send that command ${interaction.user.username}`);
            }
        }); 
    }
});

// When a new user joins your server, check if the account is older than one week, if it isn't then ban them until their account is one week old.
client.on('guildMemberAdd', async addedMember => {
    var lastWeek = new Date();
    var pastDate = lastWeek.getDate() - 7;
    lastWeek.setDate(pastDate);
    let timeToBan = (addedMember.user.createdTimestamp - lastWeek) / (1000*60*60*24);

    if (addedMember.user.createdTimestamp > lastWeek) {
        addedMember.kick(`You're account is too new ${addedMember.user.username}, it must be one week old! Created at ${addedMember.user.createdAt}`);
        let message = `Kicked new member ${addedMember.user.username} - account created: ${addedMember.user.createdAt}`;
        console.log(message);
        const logChannel = await addedMember.guild.channels.fetch(config.logChannelId);
        logChannel.send(message);
    }
});

kickEm = interaction => {
    var lastWeek = new Date();
    var pastDate = lastWeek.getDate() - 7;
    lastWeek.setDate(pastDate);

    let count = 0;

    interaction.guild.members.fetch().then(members => {
        for (const member of members.values()) {
            if (member.user.createdTimestamp > lastWeek) {
                count++;
                member.kick(`You're account is too new ${member.user.username}, it must be one week old! Created at ${member.user.createdAt}`);
                console.log(`Kicking ${member.user.username} - account created: ${member.user.createdAt}`);
            }
        }
        respondToInteraction(interaction, `I just kicked ${count} new accounts! See console log for all users kicked.`);
    }).catch(console.log);
}

// Verifies that the user who sent the command has the designated commanderRole from the config file.
verifyUser = (id) => {
    return client.guilds.fetch(config.serverId).then(guild => {
        return guild.members.fetch(id).then(member => {
            return member._roles.includes(config.allowedRoleId);
        });
    });
}

// Responds to each (/) slash command with outcome of the command, if this was triggered by a client event or an error, it logs the outcome to the log channel denoted in config
respondToInteraction = async (interaction, message, error = null) => {
    if (!interaction) {
        const mainServer = await client.guilds.fetch(config.mainServer);
        const logChannel = await mainServer.channels.fetch(config.logChannelId);
        logChannel.send(message);
    } else {

        let url = `https://discord.com/api/v8/interactions/${interaction.id}/${interaction.token}/callback`

        let json = {
            "type": 4,
            "data": {
                "content": message
            }
        }
        
        axios.post(url, json);
    }

    if (error) {
        console.log(error);
    }

    triggeredByIntention = false;
}


client.login(config.token);