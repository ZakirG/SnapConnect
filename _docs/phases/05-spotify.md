Below is a **step-by-step implementation plan** for “Pic → Tweet Song Lyrics,” expressed as a series of *prompts* you can paste into your AI coding agent.
Each step is preceded by **Developer Actions**—the manual tasks, API-key gathering, or in-app checks you need to perform **before** running that prompt.

---

## 0. Global Prerequisites

**Developer Actions**

1. Create/confirm accounts & keys:
   • Spotify → Client ID/Secret, redirect URI `snapconnect://spotify-callback`
   • Genius → Access Token
   • Pinecone → Environment + API Key
   • OpenAI → Key with GPT-4o-mini vision access
   • Twitter/X (v2) → OAuth 2.0 App, posting scope
2. Add the four secrets to your local `.env` and to Supabase “Project Secrets.”
3. Add a **`lyrics-bucket`** (public = false) in Supabase Storage.
4. In Supabase Realtime DB create a `tweets` collection: `{ id, userId, imageUrl, lyric, tweetText, createdAt }`.
5. Confirm Expo SDK 53 project is building (`npx expo start -c`).

*(Once all four keys load correctly in `process.env`, proceed.)*

---

## 1. Spotify OAuth + Playlist Fetch

**Developer Actions**
– None beyond the global prerequisites; make sure redirect URI is whitelisted in the Spotify dashboard.

**AI Coding Agent Prompt**

```
You are upgrading SnapConnect (React Native, Expo 53).  
Task: Add Spotify OAuth + playlist fetch.

Files to create/modify
1. src/services/spotify.ts
   • export async function linkAccount(): launches AuthSession.startAsync() with Spotify’s PKCE flow
   • export async function getPlaylists(accessToken): returns user playlists (first page)
   • export async function getTracks(playlistId, accessToken): returns first 100 tracks

2. src/store/user.ts
   • Extend state: spotifyAccessToken, spotifyRefreshToken, spotifyExpires
   • add setSpotifyTokens()

3. src/screens/social/ProfileScreen.js
   • Import useUserStore
   • Add “Connect Spotify” button that calls linkAccount()
   • After success, store tokens via setSpotifyTokens()
   • Below button, list playlist names once fetched.

Testing
- Log in, open ProfileScreen, tap Connect Spotify.
- Approve in Spotify’s browser popup.  
- Expect to see first playlist names rendered.
```

---

## 2. Genius Lyric Fetch + Cuss-word Scrub + Supabase Upload

**Developer Actions**
– Add a simple plaintext file `excludeWords.txt` with your banned-word list; place in `assets/`.

**AI Coding Agent Prompt**

```
Add lyric retrieval & cleaning.

Create src/services/genius.ts
--------------------------------
import Filter from 'bad-words';

export async function fetchLyrics(track, artist)
  • Search Genius API (`/search?q=${title} ${artist}`)
  • Request first hit’s URL → scrape raw lyrics (cheerio)
  • Remove bracketed annotations ([Chorus], etc.)
  • Use bad-words + excludeWords.txt to drop lines containing profanity
  • Return cleaned string

Integrate in spotify.ts
--------------------------------
export async function syncPlaylistLyrics(playlistId)
  1. getTracks()
  2. For each track, fetchLyrics()
  3. Save to Supabase:
     const { data, error } = supabase
       .storage.from('lyrics-bucket')
       .upload(`${userId}/${trackId}.txt`, cleanedLyrics, { upsert: true });

Testing
- Run a one-off script in App.tsx that invokes syncPlaylistLyrics() on the first playlist.
- Inspect Supabase Storage: expect N `.txt` files, no profanity lines.
```

---

## 3. Pinecone Index & Embedding Loader

**Developer Actions**
– In Pinecone dashboard create an index `snap-lyrics` (dimensions 1536, cosine).

**AI Coding Agent Prompt**

```
Set up embeddings.

Create src/services/pinecone.ts
--------------------------------
• import { Pinecone } from '@pinecone-database/pinecone'
• export const pineconeClient = new Pinecone(...)
• export const index = pineconeClient.index('snap-lyrics')

Create src/services/embeddings.ts
--------------------------------
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

export async function upsertLyricsToPinecone(userId)
  1. list objects in lyrics-bucket for userId
  2. for each file:
     • download text
     • split = new RecursiveCharacterTextSplitter({ chunkSize: 400, chunkOverlap: 60 })
     • for each chunk → OpenAIEmbeddings.embedQuery()
     • upsert into Pinecone with `id: ${trackId}_${i}`, metadata: { userId, track, artist }

Testing
- Call upsertLyricsToPinecone() in a dev script.
- Use Pinecone console: index should show vectors >0.
```

---

## 4. GPT-4o-mini Vision Wrapper

**Developer Actions**
– None (OpenAI key already set).

**AI Coding Agent Prompt**

```
Create src/services/openai.ts
--------------------------------
export async function describeImage(fileUri)
  • Read file into base64
  • Use fetch to POST to https://api.openai.com/v1/chat/completions
    model: 'gpt-4o-mini'
    messages: [
      { role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
        { type: 'text', text: 'Describe this image in one vivid paragraph.' }
      ]}
    ]
  • Return description string.
Testing
- Hard-code an image in SnapPreviewScreen’s onLoad; log output in console.
```

---

## 5. RAG Orchestrator (Description → Lyric)

**Developer Actions**
– None (previous services must compile).

**AI Coding Agent Prompt**

```
Create src/services/rag.ts
--------------------------------
import { index } from './pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { ChatOpenAI } from 'langchain/chat_models/openai';

export async function captionToLyric(userId, caption)
  1. const embed = await new OpenAIEmbeddings().embedQuery(caption);
  2. const results = await index.query({ vector: embed, topK: 5, filter: { userId } });
  3. Take metadata.track, metadata.artist, metadata.chunk
  4. Use ChatOpenAI() with a prompt:
      “Choose the single line that best matches: <caption>. Candidate lines: …”
  5. Return chosen line + track + artist.
Testing
- Manually call with a photo description; verify sensible lyric returns.
```

---

## 6. Twitter Composer/Poster

**Developer Actions**
– Ensure X app has write permission & callback URI `snapconnect://twitter-callback`.

**AI Coding Agent Prompt**

```
Create src/services/twitter.ts
--------------------------------
• linkAccount(): OAuth 2 PKCE
• postTweet(accessToken, text, mediaUrl?)

Create buildTweetText(imageDesc, lyric, track, artist)
  → `"${lyric}" — ${artist}, while I was ${imageDesc.toLowerCase()}`

Testing
- Mock postTweet() in dev: `console.log(text)`.
```

---

## 7. UI Wiring

**Developer Actions**
– Obtain NeumorphicButton component ready.

**AI Coding Agent Prompt**

```
ProfileScreen.js
-----------------
• Show Connect Spotify status pill (green if connected)
• If connected, show “Sync Lyrics” button → syncPlaylistLyrics() + upsertLyricsToPinecone()

SnapPreviewScreen.js
-----------------
• Import { describeImage } and { captionToLyric } and { buildTweetText, postTweet }
• Add “Tweet Lyric” button beside Send To
• On press:
    1. const desc = await describeImage(uri);
    2. const { line, track, artist } = await captionToLyric(userId, desc);
    3. const tweetText = buildTweetText(desc, line, track, artist);
    4. Show confirmation modal with preview.
    5. If user taps “Post,” call postTweet().

Testing Script
-----------------
- Full happy-path: Connect Spotify → Sync Lyrics → take photo → Tweet Lyric.
- Verify: tweet appears on timeline with lyric + uploaded image.
```

---

## 8. Regression / QA Checklist

**Developer Actions**

1. iOS & Android (Simulator + device) smoke tests for all new buttons.
2. Confirm lyrics without profanity (spot-check).
3. Confirm Supabase Storage, Pinecone, Supabase each have expected rows/objects.
4. Rate-limit Spotify and Genius calls (watch console).
5. Push EAS build; verify no Expo Go–only APIs slipped in (FaceDetector, etc.).

---

### Done 🥳

Run each prompt in sequence, validating with the tests. Once green, your “Pic → Tweet Song Lyrics” feature will be live inside SnapConnect.
