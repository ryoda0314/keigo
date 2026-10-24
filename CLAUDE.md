@AGENTS.md

# ことのえだ

Read [CONCEPT.md](CONCEPT.md) before adding anything. The flow is 浴びる → 上げてみる → 場面で言う → また出会う: a rain of
lines with their raised words lit (the everyday word above each), the same message climbing to higher listeners, a person's
line and わたし's circumstances to answer in one's own words, and the raised words coming back elsewhere. A feature that does
not fit it does not get built. No scores, no streaks, no badges, no forced review, no grammar lessons or conjugation
tables. The sisters are ことのあめ (`../polylinga`), ことのおと (`../作品,app/chinese`), ことのは (`../english`) and ことのね
(`../作成したもの/hanjaatume`); this one is built like ことのは and borrows its look, its accounts and its way of keeping a
record.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, plain CSS modules. Same versions as the sisters. `npm run dev` serves on
  port 3230.
- The learner's record (`State`, `src/lib/record.ts`) is on their device (`src/lib/store.ts`, localStorage key `keigo:v1`,
  every access guarded); signing in is optional. With a ことのあめ account (the same Supabase project, so the same accounts)
  it is also kept in `ke_records`, one row per account (`supabase/migrations/`, RLS: only their own row), read and written
  from the browser as the learner with the anon key (`src/lib/sync.ts`, as ことのは's). The two copies are merged, never
  overwritten (`mergeStates`). Everything of this app's in that project is prefixed `ke_` (for 敬語, so renaming the app
  changes nothing); never touch ことのあめ's `pl_`, ことのおと's `kn_`, ことのは's `en_` or the old app's tables, and do not
  create test users there (a trigger of the old app fires on `auth.users`). Making an account and resetting a password
  happen in ことのあめ (`NEXT_PUBLIC_KOTONOAME_URL`).
- The prepared Korean is TypeScript data in `src/content/` (typed, checked by `tests/content.test.mjs`); its audio is static
  MP3 in `public/audio`, listed in `src/content/audio.json` (key → file). A line without a clip is read in the browser's
  Korean voice.
- AI is OpenAI, server-side only (`src/lib/ai.ts`), limited per address and per server instance (`src/lib/limits.ts`, as
  ことのは's):
  - `/api/turn`: one sentence of the learner's in a scene. One call (`TALK_MODEL`, default gpt-5.5, `TALK_EFFORT` low)
    corrects it with the honorifics set for the people involved and answers as the person. The rules (`turn-core.ts`):
    the ending follows the listener, raised words follow the person in the sentence (in 반말 too), the learner steps down
    to an elder, never over-honor (things, oneself, friends), and toward professors, bosses, customers and the parents'
    generation prefer the raised word even when the plain sentence would pass; a 선배 a year or two older gets 해요체.
  - `/api/say`: voices Korean the AI wrote (a reply, a corrected sentence) in that person's voice, only with the signature
    the server gave that text (`src/lib/sign.ts`). Prepared lines never come here.
  - `/api/hear`: what the learner said aloud (gpt-4o-transcribe, Korean with Japanese mixed in), as text to check before
    sending. The recording is not kept.
- Voices (`src/content/cast.ts`, `src/lib/tts.ts`, `src/lib/speech.ts`): every person is a Gemini voice on Vertex AI
  (ことのあめ's project and service account), `gemini-3.1-flash-tts-preview` (ことのは's model: its quota is per model,
  apart from ことのあめ's live 2.5 Pro and ことのおと's 2.5 Flash), `ko-KR`, each asked in their own way (`style`) and held to
  a pace in Hangul syllables per second (`PACE_RANGE` 3–6.5, ことのあめ's; the grandmother's own `pace` is slower). Takes
  are tidied as ことのは's (`src/lib/pcm.ts`). わたし has two voices (Leda, Puck) and the learner chooses
  (設定 → わたしの声); a reply falls back on the person's OpenAI voice when Google refuses. A clip's name carries
  `VOICING`: bump it whenever the voicing itself changes.

## The content (`src/content`, pure, tested)

- `branches.ts`: `WORDS` (everyday words, height 0; raised words, height 1 or 2, each with the everyday words it stands on,
  who it is for, a one-line note, its hanja) and `BRANCHES` (an everyday word and the raised words above it; a word may sit
  on two, 드시다 on 먹다 and 마시다). Each word's `core` finds it in Korean text: it checks every mark of the content and
  decides whether the learner's own words used a word, so it must not fire on look-alikes (반드시, 계속, 함께, 진지하게,
  연세대; the test lists them). The plain -시- of a verb is marked too (`SI_MARK`, with the verb it raises as `base`) but is
  not a word of the record.
- `rains.ts`: 11 rains, each a branch or a few close ones, with lines said by わたし and by the people, to someone and
  sometimes about someone else (`about`), and climbs (上げてみる: the same message to higher listeners, each answering in
  their own voice; a climb's listeners never go down `LADDER`). Elders speak 반말 down and are raised back.
- `scenes.ts`: 16 scenes as ことのは's (the person's line, わたし's circumstances, two or three samples each putting
  something else forward, a brief in English for the person). Every raised word turns up in a rain and in two or more
  places in all.
- `cast.ts`: the people (서준, 지은 선배, 박 교수님, 할머니 of the boarding house, 사장님 of the cafe, 서준's mother), how
  わたし calls them, how they speak to わたし, their voices, styles and personas.
- Marks name a word and the exact text in the line; `markSpans` places each where its text occurs, its core fires and no
  earlier mark is (the 께 of 께서 is not 께). `everydayOf` gives the word shown above it: the mark's own `base` when it is
  not the usual one (커피 드실래요? is 마시다, 축하드려요 is 하다, 몇 분 is 몇 명), わたし stepping down mapped back
  (제가 → 내가), else the word's first everyday word.
- Line ids are stable: audio is named by voice and text, and the record keeps rain and scene ids.

## The core (`src/lib`, pure, tested in `tests/`)

- `record.ts`: as ことのは's, centred on the raised word (`words`: key → events). Event kinds: `met` (a rain fell, a scene was
  shown, a reply used it), `looked` (its branch opened), `ai` (the AI put it into the learner's sentence), `borrowed` (a
  sample sent as it was), `remade` (used with samples open), `own` (produced on their own). `stageOf` (0 not met, 1 met,
  2 used with support, 3 own) draws the dots on 枝; `grown` is できたこと (an own use after a supported one). `dueKeys` and
  `pickNext` bring words back: the rain or scene holding words due comes first, then unseen ones in order. Violet is
  `metBefore(state, word, since)`, with `since` the moment the screen opened, so what is met now stays in the accent.
- `turn-core.ts`: the prompt and the checks on every answer. The model's word is never taken for where something is:
  `litWords` keeps a named word only where its core fires and adds what the cores find, the longest standing where two
  overlap (말씀드릴 over 말씀 and 드릴); whether a raised word was the learner's own is decided from their input
  (`hadIt`); a Japanese part must be in their input; a note with no Japanese in it is left out (the field is `note_ja`
  because a note in Korean kept coming back otherwise).
- `text.ts`: comparing Korean by syllables (`sameness` tells a sample sent as it was), splitting a reply into sentences to
  voice one by one. `diff.ts` is ことのあめ's (Korean letter by letter).

## The app

- `/` intro (static). `/app` 浴びる (`_rain/Rain.tsx`): the rain's branches as rows, its lines falling one by one with their
  voices (`playInTurn`), each with who says it to whom (`WhoLine`) and its words lit; once all have fallen it counts as
  bathed in, and its climbs open (`_rain/Climb.tsx`: the people as steps; 上げる moves one up, underlines what changed from
  the step below, the lit words rise, and わたし's line and the reply are heard). Then 次の雨, 場面で言ってみる (the scene
  holding most of its words, `go.ts`), 雨を選ぶ.
- `/app/scene` 場面で言う (`scene/ScenePage.tsx`): ことのは's scene with `Conversation` and `Composer` (Korean and Japanese
  mixed, the microphone through `/api/hear`); samples only when opened, recorded as support.
- `/app/eda` 枝: every branch by group as a map to look over, each raised word with its dots. `/app/me` 自分: これまで,
  できたこと, the scene conversations; `/app/me/settings` (sound, speed, わたし's voice, the everyday words above, translations,
  the account, clearing the record). `/login`: ことのあめのアカウントでつなぐ (copied from ことのは).
- `components/Ko.tsx` draws a Korean sentence: raised words lit (accent, or violet when met before) with the everyday word
  above as ruby, the plain -시- underlined quietly with its verb above, everyday words dotted, and a correction's changes
  (`ins`/`del`) across them. `_parts/BranchHost.tsx` opens a word's branch over any screen (`useOpenBranch`): the sentence it
  was pressed in, its branches as steps (`Ladder.tsx`), its note and hanja, the lines it turns up in, its history, and the
  way to its rain.
- `components/audio.ts`: one sound at a time; prepared clips by key (`clipKey`: わたし's lines carry the chosen voice,
  `eat.1@f`), AI text through `/api/say`, the browser's Korean voice when nothing else plays.

## Commands

- `npm run dev` / `npm run build` / `npm run lint` / `npm test` (node:test, `tests/*.test.mjs`)
- `npx tsc --noEmit` (run `npx next typegen` first after adding routes)
- `node --env-file=.env.local scripts/generate-audio.mjs [--dry-run] [--limit=40] [--no-check]`: voices every prepared line
  (わたし's twice). Each take is heard back by gpt-4o-transcribe; one that does not say its line is made again, and after
  three takes the closest is kept and listed in `scripts/work/review.json` for a person to listen to. Resumable; clips no
  line uses are removed.
- `node --env-file=../polylinga/.env.local ../polylinga/scripts/migrate.mjs supabase/migrations/<file>.sql`: apply one
  migration to ことのあめ's database, in a transaction (ことのあめ's runner and connection settings).
- `python design/make-icon.py` (Pillow): the placeholder icon (an open book, a branch, leaves at three heights) into
  `public/icons/`, `src/app/icon.png`, `apple-icon.png`, `favicon.ico`, until the maker chooses a picture.

## Conventions

- UI copy in `src/lib/i18n/ja.ts`, plain, from the learner's side. Korean is set in `.t-ko` with `lang="ko"` (IBM Plex
  Sans KR, `word-break: keep-all`), and lines holding lit words get the line height for the words above them.
- Colors and type are the sisters' (`src/app/globals.css`): paper, ink, one accent, `--again` violet for what comes back.
  No gradients, emoji or shadows inside the app; hairlines separate. Motion follows the branch: words rise a step
  (`.rise`), steps grow from the bottom; reduced motion stops all of it.
- Pure modules imported by tests and scripts use `.ts` extensions in their imports (Node strips types).
- Phone first; from 720 px the tabs become a column on the left (BottomNav, the sisters' CSS). A headless Chrome window
  cannot be narrower than about 500 px: to look at a phone width, set the width through the DevTools protocol
  (`Emulation.setDeviceMetricsOverride`) rather than `--window-size`.
