The Boots page should have a "Play Game" button at the top left and a "Rules" button at the top right.  Beneath will be the game area with a grid and a "Time Elapsed:" label.


Selecting the Play Game button will begin a new game.  Time Elapsed starts at 0 seconds and the total seconds count is displayed while the game is played.  The game is a Minesweeper game with a 20x20 grid containing 45 hidden mines.  In this game, mines are themed as Mystic Explosions and will use the icon found here:  https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/mystic.jpg

As with traditional Minesweeper, the first click of the game should never reveal a mine or a number.  The game ends once a mine is selected (instead of flagged) or when all mines in the game have been correctly flagged with all non-mines being revealed.



Endgame:
a. Pause for 2 seconds (without allowing further button presses) and then the game surface should be replaced with a notification that the player has completed the game and it should display the number of seconds that it took them to complete the game. The number of seconds defaults to 9999 if the game ended due to selecting a mine. It should also look up the lowest max_score from the boots_rewards_lookup table that the player's number of seconds is equal to or less than and get the rarity.  Then select a random row from the boots_lookup table of that rarity and display to the player that they have been rewarded with the name of that item (also display the image found in the image_url field).  A row should be added to the user_inventory table for that user and with that gear_id, "Boots", and false for is_equipped.
b. Update the user_gear_playcount table for row with the player's user_id and the gear_type of "Boots" by incrementing the today_play_count by one and incrementing the total_play_count by one.
c. If the final score is within the lowest 10 scores for the "Boots" gear_type for this user in the user_top_gear_scores table, then insert a row into the table with this user_id, "Boots", current timestamp, and the seconds score.  Then delete any rows for this user and the "Boots" gear_type that have scores greater than their 10th highest. 
d. The game board should be removed.



Selecting the Rules button will display a popup with the following text:
"45 mystic explosions are hidden throughout this grid.  Press or click a cell to reveal what lies beneath.  A number tells you how many mystic explosions touch that cell.  Long-press or right-click to mark cells that you know have mystic explosions, but do not detonate them or the game will end.  Complete the grid by marking all mystic explosions as fast as you can. Good luck!"
