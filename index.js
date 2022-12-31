import { compile_expr, run_expr } from './eval.js'
import translate_from_to from './translator.js'
import format_message from './format.js'
import dotenv from 'dotenv'
dotenv.config()

import { REST, Routes, Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js'

const print = console.log

const commands = [
    {
        name: 'ping',
        description: 'Replies with pong!',
        message: 'Pong!',
    },
    {
        name: 'print',
        description: 'Print a given message',
        options: [
            {
                name: 'message',
                type: 3,
                required: true,
                description: 'The message'
            }
        ],
        message: "'%1'",
    },
    {
        name: 'whoami',
        description: 'Print your name with tag',
        message: `Of course you are '%sender'`
    },
    {
        name: 'help',
        description: 'List the available commands',
        message: 'The available commands are: %help'
    },
    {
        name: 'about',
        description: 'Give you a link to the about channel',
        message: `About channel: <#${process.env.GUILD_ABOUT_CHANNEL}>`
    },
    {
        name: 'chad',
        description: 'CALL THE CHAD',
        message: '%adm hey a random guy is calling you! Do you wanna punish him?'
    },
    {
        name: 'addcmd',
        description: 'Add a new command',
        options: [
            {
                name: 'name',
                type: 3,
                required: true,
                description: 'Command name'
            },
            {
                name: 'message',
                type: 3,
                required: true,
                description: 'The message that the command is gonna print'
            }
        ],
        message: 'Command added: `%1`'
    },
    {
        name: 'delcmd',
        description: 'Remove given command',
        options: [
            {
                name: 'name',
                type: 3,
                required: true,
                description: 'The name of the command to be removed'
            }
        ],
        message: 'Command removed: `%1`'
    },
    {
        name: 'eval',
        description: 'Evaluate a given expression',
        options: [
            {
                name: 'expression',
                type: 3,
                required: true,
                description: 'The expression to be evaluated'
            }
        ],
        message: 'Evaluating expression...'
    },
    {
        name: 'translate',
        description: 'Translate from a language to another',
        options: [
            {
                name: 'from',
                type: 3,
                required: true,
                description: 'Input language'
            },
            {
                name: 'to',
                type: 3,
                required: true,
                description: 'Output language'
            },
            {
                name: 'text',
                type: 3,
                required: true,
                description: 'Text to be translated'
            }
        ],
        message: 'Translating text...'
    },
    {
        name: 'selfrole-init',
        description: 'Initialize selfrole system',
        message: `Check <#${process.env.GUILD_REACTIONS_CHANNEL}>`
    },
    {
        name: 'setnick',
        description: 'Change someone\'s nickname',
        options: [
            {
                name: 'member',
                type: 6,
                required: true,
                description: 'The name of the member you wish to change the nickname'
            },
            {
                name: 'text',
                type: 3,
                required: true,
                description: 'The new nickname that the given user will have'
            }
        ],
        message: 'Nickname changed'
    },
    {
        name: 'vkick',
        description: 'Kick a user from its current voice channel',
        options: [
            {
                name: 'member',
                type: 6,
                required: true,
                description: 'The member you wish to kick from a voice channel'
            }
        ],
        message: 'The given member got kicked from its current voice channel'
    },
    {
        name: 'untimeout',
        description: 'Remove timeout from a user',
        options: [
            {
                name: 'member',
                type: 6,
                required: true,
                description: 'The member of which you want to remove its timeout'
            }
        ],
        message: 'The given member got its timeout removed'
    },
    {
        name: 'random',
        description: 'Choose a random number within a range',
        options: [
            {
                name: 'range',
                type: 3,
                required: true,
                description: 'The range'
            }
        ],
        message: 'Choosing a number...'
    },
    {
        name: 'recommended-sites',
        description: 'Sites i recommend you to go take a look',
        message: 'I really recomend you to check out these sites'
    },
    {
        name: 'free-robux',
        description: 'Free robux',
        message: ':warning: FREE ROBUX :warning:'
    }
]

const nonslash_commands = []

/// FUNCTIONS

function generate_command_object(name, message) {
    return {
        name: name,
        message: message
    }
}

/// ADD SLASH COMMANDS

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function refresh_slash_commands() {
    try {
        print('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(process.env.DISCORD_ID), { body: commands });

        print('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

refresh_slash_commands();

/// HANDLE SLASH COMMANDS

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('ready', () => {
    print(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (String(interaction.customId).includes('roles-')) {
        var role_name = String(interaction.customId).replace('roles-', '');
        var role = await interaction.member.guild.roles.cache.find(role => String(role.name).includes(role_name));
        if (await interaction.member.roles.cache.some(r => String(r.name).includes(role_name))) {
            await interaction.member.roles.remove(role);
            await interaction.reply(`Removed "${interaction.user.username}" from role "${role.name}"`).then(() => {
                setTimeout(() => interaction.deleteReply(), 3000);
            });
        } else {
            await interaction.member.roles.add(role);
            await interaction.reply(`Added "${interaction.user.username}" to role "${role.name}"`).then(() => {
                setTimeout(() => interaction.deleteReply(), 3000);
            });
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    for (let cmdi in commands) {
        let cmd = commands[cmdi]
        if (interaction.commandName === cmd.name) {
            let args = []
            interaction.options.data.forEach((value) => {
                args.push(String(value.value));
            });

            let permissionerror = false;

            /// THINGS TO BE EXECUTED BEFORE THE COMMAND MESSAGE

            if (cmd.name === 'addcmd') {
                if (interaction.user.id === process.env.GUILD_ADM) {
                    nonslash_commands.push(generate_command_object(args[0], args[1]));
                } else {
                    permissionerror = true;
                }
            } else if (cmd.name === 'delcmd') {
                if (interaction.user.id === process.env.GUILD_ADM) {
                    for (let command in nonslash_commands) {
                        if (nonslash_commands[command].name == args[0]) {
                            nonslash_commands.splice(command, 1);
                            break;
                        }
                    }
                } else {
                    permissionerror = true;
                }
            } else if (cmd.name === 'selfrole-init') {
                if (interaction.user.id === process.env.GUILD_ADM) {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('roles-programmer')
                                .setLabel('Programmer')
                                .setStyle(ButtonStyle.Secondary))
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('roles-artist')
                                .setLabel('Artist')
                                .setStyle(ButtonStyle.Secondary))
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('roles-youtuber')
                                .setLabel('Youtuber/Streamer')
                                .setStyle(ButtonStyle.Secondary))
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('roles-english')
                                .setLabel('English')
                                .setStyle(ButtonStyle.Secondary))
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('roles-pinged')
                                .setLabel('Pinged')
                                .setStyle(ButtonStyle.Secondary));
                    client.channels.cache.get(process.env.GUILD_REACTIONS_CHANNEL).send({ content: 'Choose a role', components: [row] });
                } else {
                    permissionerror = true;
                }
            } else if (cmd.name === 'setnick') {
                if (interaction.user.id != process.env.GUILD_ADM) {
                    permissionerror = true;
                } else {
                    const member = interaction.guild.members.cache.get(args[0]);
                    member.setNickname(args[1]);
                }
            } else if (cmd.name === 'vkick') {
                if (interaction.user.id != process.env.GUILD_ADM) {
                    permissionerror = true;
                } else {
                    const member = interaction.guild.members.cache.get(args[0]);
                    member.voice.disconnect();
                }
            } else if (cmd.name === 'untimeout') {
                if (interaction.user.id != process.env.GUILD_ADM) {
                    permissionerror = true;
                } else {
                    const member = interaction.guild.members.cache.get(args[0]);
                    member.timeout(null);
                }
            } else if (cmd.name === 'recommended-sites') {
                await interaction.channel.send(`\`\`\`
https://pornhub.com
https://xvideos.com
https://xnxx.com
https://4chan.org
https://reddit.com
https://hanime.tv (most recommended one)
\`\`\``)
            } else if (cmd.name === 'free-robux') {
                const embed = new EmbedBuilder()
                    .setColor(0xfc1808)
                    .setTitle('FREE ROBUX')
                    .setURL('https://robertosixty1.github.io/susbutton/');
                await interaction.channel.send({ embeds: [embed] });
            }

            /// REPLY WITH THE COMMAND MESSAGE

            if (permissionerror) {
                await interaction.reply(`Only <@${process.env.GUILD_ADM}> XD`);
            } else {
                await interaction.reply(
                    format_message(
                        cmd.message,
                        args,
                        interaction.user.tag,
                        commands,
                        nonslash_commands,
                        process.env.GUILD_ADM
                    )
                );
            }

            /// THINGS TO BE EXECUTED AFTER THE COMMAND MESSAGE

            if (cmd.name === 'eval') {
                try {
                    await interaction.channel.send(args[0] + ' => ' + run_expr(compile_expr(args[0])));
                } catch (err) {
                    await interaction.channel.send('Error evaluating expression: ' + err);
                }
            } else if (cmd.name === 'translate') {
                try {
                    await interaction.channel.send(args[2] + ' -> ' + await translate_from_to(args[0], args[1], args
                    [2]));
                } catch (err) {
                    await interaction.channel.send('Error translating message: ' + err);
                }
            } else if (cmd.name === 'random') {
                await interaction.channel.send(`Random number: ${String(Math.floor(Math.random() * parseInt(args[0])))}`);
            }
        }
    }
});

client.on('messageCreate', async (msg) => {
    if (msg.author.id === client.user.id) return;

    if (msg.content.startsWith('!')) {
        let args = msg.content.split(' ');
        args[0] = args[0].substring(0, 0) + args[0].substring(1, args[0].length);

        for (let cmdi in nonslash_commands) {
            let cmd = nonslash_commands[cmdi];

            if (cmd.name === args[0]) {
                args.splice(0, 1);

                await msg.channel.send(
                    format_message(
                        cmd.message,
                        args,
                        msg.author.tag,
                        commands,
                        nonslash_commands,
                        process.env.GUILD_ADM
                    )
                );
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
