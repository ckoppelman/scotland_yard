# TODOs

## Tests!

- Add tests

## Bugs

- Mr. X fades in before privacy screen appears.
- Make sure 2x increments turn number.

## Highest priority features

- Actually count the number of tiles Mr. X starts with.
- Implement trapped detectives and trapped lose condition

## Features

- pop up control panel right away?  Maybe include Mr. X board with control panel
  or at least let user see both at once.
- Let user type in station number to go to it.
- More exciting Starting location Assignment, like in the real game.
- Flesh out text of rules.  Maybe needs another few pages.
- Fix introduction screen wording.
    1. Only show intro the first time a user visits and on demand.
- New Games should start with current game's settings.
- Show settings on page
- Figure out what happens when there are multiple fugitives
    1. Where do detective tickets go?  Maybe detectives choose one fugitive?
    2. How does 2x work?
    3. What is the win condition? All Mr. Xs captured or just one? -- maybe make
       this a setting?
- Replay history
- Add 2x button to control panel.
- Add a mode to swap win conditions -- hidden player wins if they capture shown player.
- Josh really wants animated cars/buses/subways/ferries.
- favicon.ico
- Should detectives be able to see Mr. X history up until the last show point?  Should
    they also be able to see the whole board state?  This should MAAAYBE be an option,
    but kinda ruins part of the fun.
- We need to see what moves are available to each user.  Maybe a piece-opacity slider.
- Keyboard accessibility -- esp for fugitives
- Add "cheat" modes:
  - Help with finding Mr. X possible stations based on last-known location.
      (Also allow Mr. X to see this, too, I guess.)
  - Add ghost for Mr. X on most recent station
- Allow undo.  To support this, we should only calculate wins at the end of
    detectives' round

## Big Features

- Introduce multi-device support -- rooms with passwords? add move timer?
- Add chat or maybe voice!
  - Does Mr. X "hear" detective chat?  Do detectives "hear" X chat?
- Add CPU player that plays as Mr. X
- Are multi-fugitive rules competitive?
- Add CPU player that plays as detectives
- Tool to make your own map
    1. There need to be constraints maybe?
    2. We should maybe be able to route connection paths through stations they do not
       stop at like subways on the original board
    3. Validation
- Host this mother.
- Bring out transit modes, etc., into config so we can play with like sci-fi/fantasy
   themed maps or whatever.
- For sci-fi/fantasy/etc, add skins
- Mobile support -- really anything but desktop screen size in particular
- Mobile support -- real natural mobile feel
- User Logins

## Lowest-pri features

- Localization
- Tutorial mode
- Sound FX?  Music?
- Dark mode? ugh.
- Export state
- Stats
- Probably treat station number as string so we can do crazy things later
