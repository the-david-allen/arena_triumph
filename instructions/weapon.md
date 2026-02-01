The Weapon game page should be follow the layout shown in Images/weapon_game_layout.jpeg.  The page should have a "Play Game" button at the top left and a "Rules" button at the top right.  

Beneath will be the game area with the grid and a "Turns Taken:" label beginning at 0.  The grid is labeled with a number value at the top of each column and beneath each column is the slot type that should show the corresponding icon found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/  (2x boots.jpg, 2x leggings.jpg, 2x gauntlets.jpg, 2x shoulders.jpg, chestpiece.jpg, helm.jpg, and belt.jpg)

Selecting the Play Game button will begin a new game, reveal the game area with the Place button beginning disabled.  This game is a push-your-luck game inspired by a game called Can't Stop.  

highlight_color = green
lost_highlight_color = red

Pressing the Roll button should cause the following:
- 4 standard 6-sided dice should be rolled and displayed in the rolled dice area
- The Roll button should be disabled
- The player is then able to drag any two of the dice of their choice into the separated dice area.  Once they do, perform the following actions:
(a) Sum the 2 dice in the rolled dice area and store as dice_sum_1.  If the grid column labeled with dice_sum_1 has not yet had it's uppermost cell marked or highlighted, then highlight the rolled dice area with highlight_color
(b) Sum the 2 dice in the separated dice area and store as dice_sum_2. If the column labeled with dice_sum_2 has not had it's uppermost cell marked or highlighted, then highlight the separated dice area with highlight_color
(c) Determine the number of column slot icons in the grid that are highlighted.  If 0 or 1, activate the Place button.  If 3, (if the grid column with value equal to dice_sum_1 has a highlighted icon, highlight the rolled dice area and activate the Place button) and (if the grid column with value equal to dice_sum_2 has a highlighted icon, highlight the separated dice area and activate the Place button).  If 2, do the following:
-- If the grid column with value equal to dice_sum_1 has a highlighted icon, highlight the rolled dice area and activate the Place button
-- If the grid column with value equal to dice_sum_2 has a highlighted icon, highlight the separated dice area and activate the Place button
-- If the Place button is still inactive, the player must click in the rolled dice area or the separated dice area.  Clicking it will highlight that area, and only the rolled dice area or the separated dice area can be highlighted at once.  Once one of the areas is highlighted, the Place button becomes active.


Pressing the Place button causes the following:
- The Place button becomes disabled
- If the rolled dice area is highlighted, then highlight the lowermost unfilled cell in the column labeled with dice_sum_1 with highlight_color.
- If the separated dice area is highlighted, then highlight the lowermost unfilled cell in the column labeled with dice_sum_2 with highlight_color.
- If neither of the last two steps resulted in a cell being highlighted, display "No allowed placements.  You must end your turn" to the right of the End Turn button.  Change the color of all cell highlights from highlight_color to lost_highlight_color.
- Remove the highlighting from both the rolled dice area and the separated dice area.
- The Roll button becomes active

Pressing the End Turn button causes the following:
- For any cells highlighted with highlight_color, remove the highlight and instead mark the cell black
- For any cells highlighted with lost_hightlight_color, remove the highlight
- If the topmost cell of the Helm column, the Chest column, the Belt column, one or more of the Shoulders columns, one or more of the Gauntlets columns, one or more of the Leggings columns and one or more of the Boots columns have been marked, trigger the endgame.  Otherwise increment Turns Taken by one and enable the Roll button.




Endgame:
a. Pause for 2 seconds (without allowing further button presses) and then the game surface should be replaced with a notification that the player has completed the game and it should display the final Turns Taken value (this is considered their score). It should also look up the lowest max_score from the weapon_rewards_lookup table that the turns taken is equal to or less than and get the rarity.  Then select a random row from the weapon_lookup table of that rarity and display to the player that they have been rewarded with the name of that item (also display the image found in the image_url field).  A row should be added to the user_inventory table for that user and with that gear_id, "Weapon", and false for is_equipped.
b. Update the user_gear_playcount table for row with the player's user_id and the gear_type of "Weapon" by incrementing the today_play_count by one and incrementing the total_play_count by one.
c. If the final score is within the lowest 10 scores for the "Weapon" gear_type for this user in the user_top_gear_scores table, then insert a row into the table with this user_id, "Weapon", current timestamp, and the turns taken.  Then delete any rows for this user and the "Weapon" gear_type that have scores greater than their 10th highest. 
d. The game board should be removed.



Selecting the Rules button will display a popup with the following text:
"Roll 4 dice at a time and separate them into 2 sets of 2.  Place these sets to fill out the grid.  You can only place in up to 3 distinct columns each turn though, so be careful or you might roll dice that you cannot place and lose your progress for the turn.  End your turn at any point to lock in the progress you've made so far this turn.

The game ends when you have completed the Helm, Chestpiece, and Belt columns and at least one Boots, Legs, Gauntlets, and Shoulders. Good luck!"
