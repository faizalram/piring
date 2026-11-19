# Piring

Photograph what you're about to eat. Piring reads the plate with an open-weight vision model (Qwen 3.8 27B, free on Groq), splits it into warung components (nasi, lauk, sayur, sambal, kuah, drinks), and logs calories, protein, carbs and fat. One tap on ½×, 1×, 1½× or 2× corrects the portion.

Stack: Next.js on Vercel, Neon Postgres, Qwen 3.8 27B via Groq's free API, passkeys for sign-in.

## How the numbers are made

The model never writes calorie numbers for known foods. It picks an id from `lib/foods.ts` and estimates grams; the app multiplies by that food's values per 100 g. The same dish always gets the same numbers, and the portion chips scale them.

- Foods not in the catalog use the model's own per-100 g estimate and are marked less certain.
- Packaged food with a visible nutrition label (Informasi Nilai Gizi) uses the label values.
- The values in `lib/foods.ts` are estimates for typical warung cooking, not lab values. Edit them freely, and replace them with TKPI numbers where a cooked entry exists. Changes apply to new meals.

Photo calorie estimates are typically off by around a third per meal, mostly on portion size, and a 27B open model will be rougher than the largest paid models. Use Piring for consistent tracking and trends, and the portion chips when a plate is clearly bigger or smaller than usual.

## The free AI limits

Groq's free plan for `qwen/qwen3.8-27b` allows 8K tokens per minute and 200K per day for your whole account. One photo uses about 5K tokens, so that is about one photo per minute and roughly 40 a day, shared by everyone on your invite code. A second photo within the same minute waits a few seconds or asks you to try again shortly.

To switch provider or model, set `AI_BASE_URL`, `AI_MODEL` and `AI_API_KEY` in Vercel. Any OpenAI-compatible API with a vision model works (for example OpenRouter's free models, or Ollama on your own machine if Vercel can reach it).

## Deploy

You need Node.js 20+, Git, and free accounts on GitHub, Vercel and Groq (console.groq.com, no credit card).

1. **Install and generate secrets**

   ```bash
   npm install
   npm run secrets
   ```

   Copy the two lines. `INVITE_CODE` is what friends type to sign up.

2. **Push to a new private GitHub repo** called `piring`:

   ```bash
   git init
   git add .
   git commit -m "Piring v1"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/piring.git
   git push -u origin main
   ```

3. **Import into Vercel**: Add New > Project > `piring`. Add these Environment Variables, each on its own, then Deploy:
   - `SESSION_SECRET` and `INVITE_CODE` from step 1
   - `AI_API_KEY` from console.groq.com > API Keys

4. **Add the database**: Storage > Create Database > Neon > connect it to this project. Open it in Neon > SQL Editor, paste all of `schema.sql`, and Run.

5. **Redeploy**: Deployments > latest > ... > Redeploy.

6. **On your iPhone**: open `https://YOUR-PROJECT.vercel.app` in Safari, then Share > Add to Home Screen. Open Piring from the icon and Create an account (name + invite code + Face ID).

## Troubleshooting

- **"Missing environment variable X"**: add it in Vercel, then redeploy.
- **"relation ... does not exist"**: run `schema.sql` in the Neon SQL Editor, on the database named in `DATABASE_URL`.
- **"The AI_API_KEY in Vercel isn't valid"**: create a new key at console.groq.com and redeploy.
- **"The model ... isn't available"**: Groq retires preview models from time to time. Pick a current vision model from console.groq.com/docs/vision and set it as `AI_MODEL`.
- **"The free AI limit is used up for now"**: wait the time shown, or see the limits section above.
- **Passkey sign-in fails**: always use the production URL. Passkeys are tied to the domain.

## Font

Gabarito by Naipe Foundry, SIL Open Font License (`app/fonts/OFL.txt`).
