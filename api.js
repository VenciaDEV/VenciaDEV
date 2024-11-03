const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const verifiedUsers = new Set();

app.use(cors());
app.use(express.json());

client.login(process.env.DISCORD_TOKEN);

client.once('ready', () => {
    console.log('Bot hazır!');
});

app.post('/api/verify', async (req, res) => {
    const { userId, code, messageId, guildId } = req.body;

    if (verifiedUsers.has(userId)) {
        return res.json({ success: false, message: 'Bu kullanıcı zaten doğrulanmış!' });
    }

    try {
        // Kullanıcının bulunduğu sunucuyu bul
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);

        // Sunucudaki "Verified" veya "Doğrulanmış" rolünü bul
        const role = guild.roles.cache.find(r => 
            r.name.toLowerCase().includes('verified') || 
            r.name.toLowerCase().includes('doğrulanmış')
        );

        if (role) {
            await member.roles.add(role);
        }
        
        verifiedUsers.add(userId);

        // DM mesajını düzenle
        try {
            const dmChannel = await member.createDM();
            const message = await dmChannel.messages.fetch(messageId);
            await message.edit('✅ Doğrulama başarılı! Rol verildi.');
        } catch (error) {
            console.error('Mesaj düzenleme hatası:', error);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        res.json({ success: false, message: 'Bir hata oluştu!' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server çalışıyor: ${PORT}`);
});
