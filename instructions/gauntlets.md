The Gauntlets page should have a "Play Game" button at the top left and a "Rules" button at the top right.  The game screen layout should look like Images/tavern.png

# Mini-game Spec: Gauntlets Game

## 0) Summary
Four horizontal bars. Each bar has a Door on the left and a Keg on the right. Patrons enter from doors and walk toward the kegs. The player controls the Tavernkeeper at the keg side and must fill and slide full mugs left to patrons. Patrons catch full mugs, slide left (toward the door) by a fixed distance, then (if they didn’t exit) pause briefly and resume advancing while returning an empty mug right. Player starts with 4 lives. Game ends at 0 lives. Score = elapsed seconds survived.

## 1) Platforms / Input
- Desktop: keyboard + mouse
- Mobile: touch (pointer events)
- Controls:
  - Move Tavernkeeper: Up/Down arrow keys move 1 bar up/down (instant snap).
  - Click/tap:
    - Click current bar lane => attempt pour (fill -> slide full mug).
    - Click bar above/below => move 1 bar in that direction (instant snap).
- Action while filling is locked: no movement or pour input accepted during fill.

## 2) Game Flow
### 2.1 Countdown
- Show overlay countdown: 5,4,3,2,1 (one number per second).
- Duration: exactly 5 seconds.
- No input accepted; nothing moves.
- After countdown ends: enter PLAYING and start timer at 0.0.

### 2.2 HUD
- Top-left: timer (seconds elapsed since PLAYING began).
- Top-right: lives as 4 hearts.

## 3) Coordinate System / Layout
- Use Canvas 2D.
- Internal base resolution of the background image:
  - BASE_W = 2048, BASE_H = 1895 
- Canvas scales to fit container while preserving aspect ratio (letterbox allowed).
- Use devicePixelRatio for crisp rendering.
- Reserve top HUD band:
  - HUD_H = 50
- Lanes:
  - NUM_BARS = 4
  - Lanes span y in [HUD_H, BASE_H]
  - Each lane has yCenter and a laneHeight.

### 3.1 Door/Keg positions (constants)
4 bars with the following normalized positions on the background image (0..1)

export const BARS = [
  { y: .2422, xDoorCenter: .2185, xKegCenter: .7376 },
  { y: .4440, xDoorCenter: .1559, xKegCenter: .8030 },
  { y: .6458, xDoorCenter: .0906, xKegCenter: .8637 },
  { y: .8476, xDoorCenter: .0187, xKegCenter: .9244 },
];

- Fail boundaries with normalized positions on the background image (0..1):
  - DOOR_FAIL_X = {.2353, .1727, .1102, .0458} (if full mug x <= this => miss + life loss)
  - KEG_FAIL_X  = {.6545, .7199, .7750, .8375} (if patron x >= this => patron reached keg + life loss; if empty mug x >= this => evaluate catch)

Usable bar length:
- barLen can be calculated as xKegCenter - xDoorCenter
Patron slide distance (normalized on the background image (0..1)):
- patron_slide_distance = .23
- slideDist = .23



## 4) Core Constants (tunable)
Given:
- mug_fill_time = 1.5s
- patron_slide_distance = 250

Defaults (confirmed):
- fullMugSpeed  = 520 px/s  (fast enough that one bar won’t have 2 full mugs in flight if fill_time=1.5s)
- emptyMugSpeed = 620 px/s
- patronSpeedStart = 80 px/s
- patronSpeedMax   = 150 px/s
- slideBackSpeed   = 240 px/s
- pauseAfterCatch  = 1.0s
- livesStart = 4

Radii:
- mugRadius = 10
- patronRadius = 18
Catch rule uses circle overlap on centers:
- catch if |mug.x - patron.x| <= (mugRadius + patronRadius)

## 5) Entities & State

### 5.1 Tavernkeeper
- Position:
  - x is fixed at xKegCenter
  - y snaps to currentBar’s yCenter
- State:
  - IDLE: accepts move/pour
  - FILLING: locked for mug_fill_time seconds (no inputs)
- Pour behavior:
  - If IDLE and player pours on current bar:
    - If a FullMug already exists on that bar, ignore pour (should be rare).
    - Enter FILLING for mug_fill_time.
    - When fill completes: spawn FullMug at xKegCenter on that bar, moving left. Return to IDLE.

### 5.2 Patron
A patron belongs to one bar (lane).
States:
- ADVANCING: moves right at patronSpeed(t)
- SLIDING_BACK: immediately after catching a full mug, moves left by slideDist at slideBackSpeed
- PAUSE: after slide-back completes (if not exited), pause for 1.0s
- RETURNING: after pause, patron returns to ADVANCING while an EmptyMug travels right
Exit:
- If at any time patron.x <= xDoorCenter => patron disappears (exits through door). No empty mug is created if they exit.

Failure:
- If patron.x >= KEG_FAIL_X => patron disappears, crash sound, lose 1 life.

### 5.3 FullMug
- Spawns at xKegCenter on a bar when fill completes.
- Moves left at fullMugSpeed.
- Catch:
  - If it overlaps any patron on the same bar, it is caught:
    - Determine catcher priority: choose the patron with the largest x (closest to the Tavernkeeper/keg).
    - Remove FullMug.
    - That patron transitions to SLIDING_BACK.
- Miss:
  - If full mug reaches x <= DOOR_FAIL_X without being caught:
    - Remove FullMug.
    - crash sound
    - lose 1 life.

### 5.4 EmptyMug
Created only if a patron caught a full mug AND did not exit after sliding back.
- Spawn timing:
  - After patron finishes SLIDING_BACK, if patron.x > xDoorCenter:
    - Patron enters PAUSE for 1.0s.
    - After pause ends, create EmptyMug at x = patron.x (same bar) moving right at emptyMugSpeed.
    - Patron enters RETURNING (which is ADVANCING + has an empty mug in flight).
- Travel:
  - Moves right independently of patron.
- Catch / crash:
  - When empty mug reaches x >= KEG_FAIL_X:
    - If Tavernkeeper is currently on that bar AND is not FILLING:
      - mug is caught and disappears (no penalty)
    - Else:
      - mug disappears
      - crash sound
      - lose 1 life

Note: if patron reaches KEG_FAIL_X while its EmptyMug is still in flight, the patron failure triggers life loss and both patron and its empty mug are removed.

## 6) Life Loss Rules (confirmed)
Lose 1 life when:
1) Empty mug reaches keg end and Tavernkeeper is not there to catch.
2) Full mug reaches door end without being caught (crash sound).
3) Any patron reaches keg end (crash sound).
Life losses can stack in a single update tick (apply each triggered loss; clamp lives at 0).

## 7) Difficulty Progression
Over time:
- patrons spawn more frequently
- patrons move faster
- max patrons per bar increases gradually up to 4

Ramp defaults:
- Spawn interval starts at 2.0s and ramps down to 0.7s by 90s (clamped).
- Patron speed ramps from 80 px/s to 150 px/s by 90s (clamped).
- Max patrons per bar by elapsed time:
  - 0–15s: 1
  - 15–35s: 2
  - 35–60s: 3
  - 60s+: 4
Spawn rule:
- On each spawn attempt, choose a random bar that is below its current max capacity.
- If all bars are at capacity, skip that spawn attempt (try again next tick).

## 8) Update Loop
- Use requestAnimationFrame + fixed timestep accumulator:
  - FIXED_DT = 1/60
Per fixed step in PLAYING:
1) Apply queued input events (move/pour if allowed).
2) Spawn patrons if spawn timer elapsed.
3) Update patrons by state (advance/slide/pause/return).
4) Update mugs (full mugs left, empty mugs right).
5) Resolve catches (full mug -> patron).
6) Resolve failures (patron at keg, full mug at door, empty mug at keg).
7) Apply life losses; if lives == 0 => enter GAME_OVER trigger.

## 9) Score
- scoreSeconds = floor(elapsedSeconds) at the instant lives becomes 0.

## 10) Endgame (server + UI)
When lives reaches 0:
1) Immediately stop gameplay updates and input.
2) Wait 2.0 seconds.
3) Replace game surface with end screen:
   - Text: "You lasted ” + scoreSeconds + " seconds!"
4) End screen shows:
   - awarded item name
   - awarded item image (image_url)

After displaying end screen, remove/hide the game board (canvas) from DOM.

### 10.1 DB logic requirements
- Determine reward rarity:
  - Find the highest min_score in gauntlets_rewards_lookup where min_score <= scoreSeconds.
  - Use its rarity.
- Select random item:
  - Pick a random row from gauntlets_lookup where rarity matches.
- Persist:
  a) Insert into user_inventory: (user_id, gear_id, gear_type="Gauntlets", is_equipped=false)
  b) Update user_gear_playcount where (user_id, gear_type="Gauntlets"):
     - today_play_count += 1
     - total_play_count += 1
  c) Maintain top 10 scores for (user_id, gear_type="Gauntlets"):
     - If scoreSeconds is within top 10:
       - insert row (user_id, gear_type="Gauntlets", now, scoreSeconds)
       - delete rows below the 10th highest score for that user/type


Selecting the Rules button will display a popup with the following text:
"Hello Tavernkeeper.  Fill the mugs and provide the patrons with their drinks and do not let them get to the kegs while still thirsty.  Good luck!"



Assets:
Background game image of the tavern: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/gauntlets_game/tavern_working.png 
Heart image for life points: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/gauntlets_game/heart.png (player begins with 4 life points, so 4 of these images should be side-by-side at the top right at the beginning of the game with one image being removed each time a life is lost)
Tavernkeeper default image: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/gauntlets_game/tavernkeeper_left_facing.png
Tavernkeeper image when filling mug: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/gauntlets_game/tavernkeeper_right_facing.png
Mug image: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/gauntlets_game/mug.png
Empty Mug image: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/gauntlets_game/mug_empty.png
Patron: https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/gauntlets_game/tavernkeeper_left_facing.png (using the tavernkeeper image while testing)