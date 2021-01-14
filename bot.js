const { Telegraf } = require('telegraf');
const fs = require('fs');

const botConfig = JSON.parse(fs.readFileSync('config.json'));
const bot = new Telegraf(process.env.BOT_TOKEN);

const regExObj = {
    kick: /^!(.+)?(кик|выгнать)/i,
    mute: /^!(.+)?(мут|заткн|молч) ?( ?(\D+)? ?(\d+) ?.+ ?(часов|час|минут|минуту|дней|день|суток|сутки))?/i,
    unmute: /^!(.+)?размут/i, ban: /^!(.+)?бан/i, unban: /^!(.+)?разбан/i,
};

bot.use((_, next) => next());
bot.catch(err => console.log(err));

bot.on('new_chat_members', async (msg) => {
    const chatId = msg.message.chat.id
    for (const userObj of msg.message.new_chat_members) {
        const userId = userObj.id;
        const firstName = userObj.first_name || '';
        const lastName = userObj.last_name || '';

        if (chatId === botConfig.catGroupId) {
            await msg.reply(
                `Привет <b><a href='tg://user?id=${userId}'>${escapeHtml(firstName + lastName)}</a></b>!\n` +
                `Добро пожаловать к нам в <b>${escapeHtml(msg.chat.title)}</b>!`,
                { parse_mode: 'HTML' }
            );
        }
    }
});

bot.hears([regExObj.kick, regExObj.mute, regExObj.unmute, regExObj.ban, regExObj.unban], async (msg) => {
    const user = msg.message.from.id;
    const text = msg.message.text;

    if (!('reply_to_message' in msg.message) || msg.message.reply_to_message.from.is_bot || !botConfig.owners.includes(user)) {
        return;
    }

    const userId = msg.message.reply_to_message.from.id; // user to action
    if (user === userId) {
        return msg.reply('<b>Не не не, сам давай</b>', { parse_mode: 'HTML' });
    }

    if (text.match(regExObj.kick)) {
        await msg.kickChatMember(userId);
        const successfully = await msg.unbanChatMember(userId);
        if (successfully) {
            return msg.reply(`<b>Выгнал его отсюда как лоха, хех</b>`, { parse_mode: 'HTML' });
        }
    } else if (text.match(regExObj.unmute)) {
        const successfully = await msg.restrictChatMember(userId, {
            can_send_messages: true, can_send_media_messages: true,
            can_send_polls: true, can_send_other_messages: true,
            can_add_web_page_previews: true
        });
        if (successfully) {
            return msg.reply(`<b>Ты дал ему дар речи!</b>`, { parse_mode: 'HTML' });
        }
    } else if (text.match(regExObj.mute)) {
        const count = +text.match(regExObj.mute)[5] || 1;
        let x = 3600;

        if (['минут', 'минуту'].includes(text.match(regExObj.mute)[6])) {
            x = 60;
        } else if (['дней', 'день', 'суток', 'сутки'].includes(text.match(regExObj.mute)[6])) {
            x = 86400;
        }
        const successfully = await msg.restrictChatMember(userId, {
            can_send_messages: false, can_send_media_messages: false,
            can_send_polls: false, can_send_other_messages: false,
            can_add_web_page_previews: false, until_date: (Date.now() / 1000 | 0) + count * x
        });
        if (successfully) {
            return msg.reply(`<b>Успешно вставил кляп в рот!</b>`, { parse_mode: 'HTML' });
        }
    } else if (text.match(regExObj.unban)) {
        const successfully = await msg.unbanChatMember(userId);
        if (successfully) {
            return msg.reply(`<b>Я надеюсь он заслужил разбана...</b>`, { parse_mode: 'HTML' });
        }
    } else if (text.match(regExObj.ban)) {
        const successfully = await msg.kickChatMember(userId);
        if (successfully) {
            return msg.reply(`<b>Отправился в путешествие на крыльях бана!</b>`, { parse_mode: 'HTML' });
        }
    }
});

bot.start(({ reply }) => reply(`<b>Мяу!</b>`, { parse_mode: 'HTML' }));
bot.help(({ reply }) => reply(`<b>Муррр!</b>`, { parse_mode: 'HTML', reply_markup: {inline_keyboard: [[{text: '» 💿Bot source »', url: 'https://github.com/Vandomas/cat-bot'}]]} }));

const escapeHtml = (str) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
bot.launch().then(() => console.log('Bot launched!'))