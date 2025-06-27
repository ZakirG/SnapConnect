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