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

// Kullanıcı kodlarını saklayacak obje
const userCodes = new Map();
const verifiedUsers = new Set();

app.use(cors());
app.use(express.json());

// Yeni kod oluşturma endpoint'i
app.post('/api/generate-code', (req, res) => {
    const { userId } = req.body;
    
    // Benzersiz kod oluştur
    const code = generateUniqueCode();
    
    // Kodu kullanıcıyla eşleştir
    userCodes.set(userId, code);
    
    res.json({ code });
});

// Doğrulama endpoint'i
app.post('/api/verify', async (req, res) => {
    const { userId, code, messageId, guildId } = req.body;
    
    // Kullanıcının doğru kodunu kontrol et
    const correctCode = userCodes.get(userId);
    
    if (!correctCode || code !== correctCode) {
        return res.json({ success: false, message: 'Hatalı kod!' });
    }

    if (verifiedUsers.has(userId)) {
        return res.json({ success: false, message: 'Zaten doğrulanmış!' });
    }

    try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);
        const role = guild.roles.cache.find(r => 
            r.name.toLowerCase().includes('verified') || 
            r.name.toLowerCase().includes('doğrulanmış')
        );

        if (role) {
            await member.roles.add(role);
        }
        
        verifiedUsers.add(userId);
        userCodes.delete(userId); // Kullanılan kodu sil

        res.json({ success: true });
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        res.json({ success: false, message: 'Bir hata oluştu!' });
    }
});

function generateUniqueCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

client.login(process.env.DISCORD_TOKEN);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server çalışıyor: ${PORT}`)); 
