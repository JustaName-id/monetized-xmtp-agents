interface ZodiacSign {
  start: [number, number];
  end: [number, number];
  symbol: string;
}

interface UserProfile {
  sign: string;
  birthday?: string;
}

export class HoroscopeProcessor {
  private zodiacSigns: Record<string, ZodiacSign>;
  private userProfiles: Map<string, UserProfile>;

  constructor() {
    // Zodiac signs with date ranges
    this.zodiacSigns = {
      aries: { start: [3, 21], end: [4, 19], symbol: '♈' },
      taurus: { start: [4, 20], end: [5, 20], symbol: '♉' },
      gemini: { start: [5, 21], end: [6, 20], symbol: '♊' },
      cancer: { start: [6, 21], end: [7, 22], symbol: '♋' },
      leo: { start: [7, 23], end: [8, 22], symbol: '♌' },
      virgo: { start: [8, 23], end: [9, 22], symbol: '♍' },
      libra: { start: [9, 23], end: [10, 22], symbol: '♎' },
      scorpio: { start: [10, 23], end: [11, 21], symbol: '♏' },
      sagittarius: { start: [11, 22], end: [12, 21], symbol: '♐' },
      capricorn: { start: [12, 22], end: [1, 19], symbol: '♑' },
      aquarius: { start: [1, 20], end: [2, 18], symbol: '♒' },
      pisces: { start: [2, 19], end: [3, 20], symbol: '♓' },
    };

    // Store user preferences
    this.userProfiles = new Map<string, UserProfile>();
  }

  async processMessage(
    messageContent: string,
    senderAddress: string
  ): Promise<string> {
    const message = messageContent.toLowerCase().trim();

    // Help command
    if (message.includes('help') || message === '/help') {
      return this.getHelpMessage();
    }

    // Set zodiac sign
    if (message.startsWith('my sign is ') || message.startsWith('i am ')) {
      return this.setUserSign(message, senderAddress);
    }

    // Set birthday
    if (message.includes('birthday') || message.includes('born')) {
      return this.setBirthday(message, senderAddress);
    }

    // Get horoscope for yesterday/tomorrow
    if (message.includes('yesterday') || message.includes('tomorrow')) {
      const day = message.includes('yesterday') ? 'yesterday' : 'tomorrow';
      const profile = this.userProfiles.get(senderAddress);

      if (!profile || !profile.sign) {
        return "I don't know your zodiac sign yet! Please tell me by saying 'My sign is [sign]' or share your birthday.";
      }

      return await this.getHoroscopeForSign(profile.sign, day);
    }

    // Get horoscope
    if (
      message.includes('horoscope') ||
      message.includes('reading') ||
      message === 'today'
    ) {
      return await this.getHoroscope(senderAddress);
    }

    // Get horoscope for specific sign and day
    for (const sign of Object.keys(this.zodiacSigns)) {
      if (message.includes(sign)) {
        const day = message.includes('yesterday')
          ? 'yesterday'
          : message.includes('tomorrow')
          ? 'tomorrow'
          : 'today';
        return await this.getHoroscopeForSign(sign, day);
      }
    }

    return this.getWelcomeMessage();
  }

  setUserSign(message: string, address: string): string {
    for (const sign of Object.keys(this.zodiacSigns)) {
      if (message.includes(sign)) {
        this.userProfiles.set(address, { sign: sign });
        return `✨ Got it! I've set your sign as ${
          sign.charAt(0).toUpperCase() + sign.slice(1)
        } ${
          this.zodiacSigns[sign].symbol
        }. Type "horoscope" to get your daily reading!`;
      }
    }
    return "I couldn't identify your zodiac sign. Please try saying something like 'My sign is Leo' or 'I am a Virgo'.";
  }

  setBirthday(message: string, address: string): string {
    const patterns = [
      // MM/DD format
      /(\d{1,2})[\/\-](\d{1,2})/,
      // "born on 8 july" or "birthday is 8 july"
      /(?:born|birthday).*?(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      // "july 8" format
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i,
      // "8th july" format
      /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    ];

    const monthNames = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        let month: number;
        let day: number;

        if (pattern === patterns[0]) {
          // MM/DD format
          month = parseInt(match[1]);
          day = parseInt(match[2]);
        } else if (pattern === patterns[1] || pattern === patterns[3]) {
          // "born on 8 july" or "8th july" format
          day = parseInt(match[1]);
          month = monthNames[match[2].toLowerCase() as keyof typeof monthNames];
        } else {
          // "july 8" format
          month = monthNames[match[1].toLowerCase() as keyof typeof monthNames];
          day = parseInt(match[2]);
        }

        if (
          month &&
          day &&
          month >= 1 &&
          month <= 12 &&
          day >= 1 &&
          day <= 31
        ) {
          const sign = this.getZodiacSign(month, day);

          if (sign) {
            this.userProfiles.set(address, {
              sign: sign,
              birthday: `${month}/${day}`,
            });
            return `🎂 Thanks! Based on your birthday (${month}/${day}), you're a ${
              sign.charAt(0).toUpperCase() + sign.slice(1)
            } ${
              this.zodiacSigns[sign].symbol
            }. Type "horoscope" for your daily reading!`;
          }
        }
      }
    }

    return "Please share your birthday in a format like 'MM/DD', 'July 8', '8 July', or 'I was born on July 8th'.";
  }

  getZodiacSign(month: number, day: number): string | null {
    for (const [sign, dates] of Object.entries(this.zodiacSigns)) {
      const [startMonth, startDay] = dates.start;
      const [endMonth, endDay] = dates.end;

      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay) ||
        (startMonth > endMonth && (month === startMonth || month === endMonth))
      ) {
        return sign;
      }
    }
    return null;
  }

  async getHoroscope(address: string): Promise<string> {
    const profile = this.userProfiles.get(address);

    if (!profile || !profile.sign) {
      return "I don't know your zodiac sign yet! Please tell me by saying 'My sign is [sign]' or share your birthday.";
    }

    return await this.getHoroscopeForSign(profile.sign);
  }

  async getHoroscopeForSign(
    sign: string,
    day: string = 'today'
  ): Promise<string> {
    return await this.fetchHoroscopeFromAPI(sign, day);
  }

  async fetchHoroscopeFromAPI(
    sign: string,
    day: string = 'today'
  ): Promise<string> {
    // Try multiple APIs for better reliability
    const apis = [
      {
        name: 'Aztro',
        fetch: () => this.fetchFromAztro(sign, day),
      },
      {
        name: 'Horoscope API (backup)',
        fetch: () => this.fetchFromHoroscopeAPI(sign, day),
      },
    ];

    for (const api of apis) {
      try {
        console.log(`🔮 Trying ${api.name} API for ${sign} ${day}...`);
        const result = await api.fetch();
        console.log(`✅ Successfully got horoscope from ${api.name}`);
        return result;
      } catch (error) {
        console.error(
          `❌ ${api.name} API failed:`,
          error instanceof Error ? error.message : String(error)
        );
        continue;
      }
    }

    console.log('🔄 All APIs failed, using fallback generator');
    return this.generateFallbackHoroscope(sign);
  }

  private async fetchFromAztro(sign: string, day: string): Promise<string> {
    const response = await fetch(
      `https://aztro.sameerkumar.website/?sign=${sign}&day=${day}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Aztro API request failed: ${response.status}`);
    }

    const horoscopeData = await response.json();
    return this.formatHoroscopeResponse(horoscopeData, sign);
  }

  private async fetchFromHoroscopeAPI(
    sign: string,
    day: string
  ): Promise<string> {
    // Alternative free horoscope API
    const dayParam =
      day === 'today' ? 'TODAY' : day === 'tomorrow' ? 'TOMORROW' : 'YESTERDAY';
    const response = await fetch(
      `https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${sign.toUpperCase()}&day=${dayParam}`
    );

    if (!response.ok) {
      throw new Error(`Horoscope API request failed: ${response.status}`);
    }

    const data: unknown = await response.json();

    // Type guard for the API response
    if (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'data' in data &&
      data.success === true &&
      data.data &&
      typeof data.data === 'object' &&
      'horoscope_data' in data.data &&
      'date' in data.data
    ) {
      const signInfo = this.zodiacSigns[sign];
      const horoscopeData = data.data as {
        horoscope_data: string;
        date: string;
      };
      return `${signInfo.symbol} ${sign.toUpperCase()} - ${
        horoscopeData.date
      }\n\n🔮 ${horoscopeData.horoscope_data}\n\n✨ Stay cosmic! ✨`;
    }

    throw new Error('Invalid response from Horoscope API');
  }

  formatHoroscopeResponse(data: any, sign: string): string {
    const signInfo = this.zodiacSigns[sign];
    let horoscope = `${signInfo.symbol} ${sign.toUpperCase()} - ${
      data.current_date
    }\n\n`;

    horoscope += `🔮 ${data.description}\n\n`;

    if (data.mood) horoscope += `😊 Mood: ${data.mood}\n`;
    if (data.lucky_number)
      horoscope += `🍀 Lucky Number: ${data.lucky_number}\n`;
    if (data.lucky_time) horoscope += `⏰ Lucky Time: ${data.lucky_time}\n`;
    if (data.color) horoscope += `🎨 Lucky Color: ${data.color}\n`;
    if (data.compatibility)
      horoscope += `💕 Compatibility: ${data.compatibility}\n`;

    horoscope += `\n✨ Date Range: ${data.date_range} ✨`;

    return horoscope;
  }

  generateFallbackHoroscope(sign: string): string {
    const themes: Record<string, string[]> = {
      aries: ['leadership', 'energy', 'new beginnings', 'courage'],
      taurus: ['stability', 'luxury', 'patience', 'determination'],
      gemini: [
        'communication',
        'curiosity',
        'adaptability',
        'social connections',
      ],
      cancer: ['emotions', 'home', 'intuition', 'nurturing'],
      leo: ['creativity', 'confidence', 'recognition', 'self-expression'],
      virgo: ['organization', 'health', 'service', 'attention to detail'],
      libra: ['balance', 'relationships', 'beauty', 'harmony'],
      scorpio: ['transformation', 'intensity', 'secrets', 'passion'],
      sagittarius: ['adventure', 'philosophy', 'freedom', 'exploration'],
      capricorn: ['ambition', 'structure', 'responsibility', 'achievement'],
      aquarius: ['innovation', 'friendship', 'independence', 'humanitarian'],
      pisces: ['dreams', 'compassion', 'spirituality', 'imagination'],
    };

    const predictions = [
      'Today brings opportunities for growth and positive change.',
      'Your intuition is particularly strong right now.',
      'Focus on relationships and communication today.',
      'A creative project may come to fruition.',
      'Financial matters require your attention.',
      'Trust your instincts in decision-making.',
      'New connections may prove beneficial.',
      'Take time for self-care and reflection.',
      'An unexpected opportunity may present itself.',
      'Your natural talents will shine today.',
      'Consider taking a calculated risk.',
      'Family or home matters need your attention.',
    ];

    const moodOptions = [
      'Optimistic',
      'Focused',
      'Creative',
      'Determined',
      'Peaceful',
      'Energetic',
    ];
    const colorOptions = ['Blue', 'Green', 'Purple', 'Gold', 'Silver', 'Red'];
    const numberOptions = [7, 3, 21, 9, 15, 42, 6, 18, 24, 33];

    const theme = themes[sign][Math.floor(Math.random() * themes[sign].length)];
    const prediction =
      predictions[Math.floor(Math.random() * predictions.length)];
    const mood = moodOptions[Math.floor(Math.random() * moodOptions.length)];
    const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    const luckyNumber =
      numberOptions[Math.floor(Math.random() * numberOptions.length)];

    const signInfo = this.zodiacSigns[sign];
    const today = new Date().toLocaleDateString();

    return `${signInfo.symbol} ${sign.toUpperCase()} - ${today}

🔮 The stars highlight ${theme} in your life today. ${prediction} Remember to stay true to your ${sign} nature and embrace the cosmic energy surrounding you.

😊 Mood: ${mood}
🍀 Lucky Number: ${luckyNumber}
🎨 Lucky Color: ${color}

✨ Generated with cosmic wisdom ✨`;
  }

  getWelcomeMessage(): string {
    return `🔮 Welcome to your personal Horoscope Agent! ✨

I can provide you with daily horoscope readings based on your zodiac sign.

Commands:
• Tell me your sign: "My sign is Leo"
• Share your birthday: "My birthday is 8/15"
• Get your horoscope: "horoscope" or "today"
• Yesterday/Tomorrow: "yesterday" or "tomorrow"
• Get any sign's horoscope: "gemini horoscope"
• Past/Future readings: "leo tomorrow" or "virgo yesterday"
• Help: "help"

What's your zodiac sign? 🌟`;
  }

  getHelpMessage(): string {
    return `🌟 Horoscope Agent Help 🌟

Available commands:
• "My sign is [sign]" - Set your zodiac sign
• "My birthday is MM/DD" - Set birthday (I'll detect your sign)
• "horoscope" or "today" - Get your daily reading
• "yesterday" or "tomorrow" - Get past/future readings
• "[sign] horoscope" - Get reading for any sign
• "[sign] yesterday/tomorrow" - Get past/future for any sign
• "help" - Show this help message

Zodiac signs I know:
♈ Aries ♉ Taurus ♊ Gemini ♋ Cancer ♌ Leo ♍ Virgo
♎ Libra ♏ Scorpio ♐ Sagittarius ♑ Capricorn ♒ Aquarius ♓ Pisces

Ready to explore the cosmos? 🌌`;
  }
}
