/**
 * This service handles all interactions with the OpenAI API.
 */
import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import { OPENAI_API_KEY } from '@env';

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables.');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/**
 * Generates a descriptive caption for an image from the perspective of the photographer.
 *
 * @param {string} mediaUri - The local URI of the image to generate a caption for.
 * @returns {Promise<string>} A promise that resolves with the generated caption.
 */
export const generateCaption = async (mediaUri: string): Promise<string> => {
  try {
    const base64Image = await FileSystem.readAsStringAsync(mediaUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: "write a description of the image from the perspective of the person who took it describing their experience in that situation using I pronouns as if they were in the situation. For example if they're taking a picture of nature the caption might be \"I'm looking at a beautiful plant right now and I'm reminded of the beauty of life.\". If the user is taking a selfie, the caption might say 'My skin is glowing today and my beard looks awesome.'. The caption should be 1 short sentence long, it will be used as a tweet, but the image in question will not be shown, the audience will only see the caption, so don't assume that they can see the image. Text only, do not use emojis. Reply only with the text as a raw response. Make your caption of the image as specific to the image as possible, trying to point out specific details so that the user feels seen and noticed for their unique experience.",
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    if (response.choices[0].message.content) {
      return response.choices[0].message.content;
    } else {
      throw new Error('Failed to generate caption, received no content.');
    }
  } catch (error) {
    console.error('Error generating caption from OpenAI:', error);
    throw new Error('Failed to generate image caption.');
  }
};

/**
 * Generates 3 catchy tweet variations based on the user's input text.
 *
 * @param {string} userText - The original text from the user expressing their thoughts/mood.
 * @returns {Promise<string[]>} A promise that resolves with an array of 3 tweet variations.
 */
export const generateTweetVariations = async (userText: string): Promise<string[]> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Take this personal thought/mood and rephrase it into 3 different catchy, engaging tweet variations. Keep the same core sentiment but make them more Twitter-ready and engaging. Each should be under 200 characters. Do not use emojis.
          Do not use hashtags. Your tone of writing should be cynical, sarcastic, educated, and funny.

Original text: "${userText}"

Return exactly 3 variations, each on a separate line, with no numbering or extra formatting. Just the tweet text.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.8, // Higher creativity for varied tweet styles
    });

    if (response.choices[0].message.content) {
      const variations = response.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3); // Ensure we only get 3 variations
      
      if (variations.length < 3) {
        throw new Error('Failed to generate 3 tweet variations');
      }
      
      return variations;
    } else {
      throw new Error('Failed to generate tweet variations, received no content.');
    }
  } catch (error) {
    console.error('Error generating tweet variations from OpenAI:', error);
    throw new Error('Failed to generate tweet variations.');
  }
}; 