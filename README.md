# Reverse Outfit Search

Pinterest or image upload in, Vinted-style secondhand matches out.

## What this MVP does

- Accepts a Pinterest URL or image upload
- Resolves Pinterest pages to a shareable image when possible
- Uses OpenAI vision or Gemini vision to extract structured clothing items
- Converts items into resale-oriented search queries
- Searches Vinted.ee and ranks listing matches per detected item
- Falls back to sample analysis and sample results when external services are not configured

## Run locally

1. Install dependencies
   - `npm install`
2. Configure environment
   - `cp .env.example .env.local`
   - Set `OPENAI_API_KEY` or `GEMINI_API_KEY`
3. Start the app
   - `npm run dev`

## Notes

- Vinted does not provide a documented public API for this workflow. The implementation uses the catalog page and embedded page data as a best-effort search approach, with a mock fallback if the upstream response shape changes.
- Pinterest URLs can be difficult to resolve because of anti-bot behavior. The app attempts to read Open Graph metadata and falls back cleanly if the source image cannot be extracted.
