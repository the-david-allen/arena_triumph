The Shoulders page should be laid out as shown in Images/shoulders_game_layout.jpeg


There should be a "Play Game" button at the top left and a "Rules" button at the top right.

Selecting the Play Game button will begin a new game. 

Turns remaining will start at 8.
Score will start at 0.
Strikes will start at 0.
Banked Score will start at 0.


The Bank Dice button is inactive to start the game.

Pressing the Roll button will roll remaining dice (6 minus the number in the Banked Dice area).  If all 6 dice are in the banked dice area, then all 6 will become unlocked, removed from the banked dice area, and all 6 dice will get rolled in the dice area. Then deactivate the Roll button.  Each die has 6 faces:

Armor (image found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/chestpiece.jpg)
Weapon (image found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/weapon.jpg)
Aquatic (image found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/aquatic.jpg)
Fire (image found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/fire.jpg)
Verdant (image found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/verdant.jpg)
Rock (image found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/rock.jpg)

The dice rolled will be displayed in the Dice Area.  A player may then select one or more die or may drag one or more die to the banked dice area.  If the dice selected or dragged into the banked dice area form a valid scoring combination, the Bank Dice button is then enabled and can be pressed.  If no valid scoring combination exists from the rolled dice, bold red text should display indicating "Strike!", the Banked Score should be set to 0, and both the Bank Dice and Roll buttons should be disabled so that the player can only select End Turn at that point.

Valid Scoring combinations and their score values:
1 or 2 Armor:  50 each
1 or 2 Weapon:  100 each
3 Armor or 3 Weapon:  800
3 Aquatic or 3 Fire:  250
3 Verdant or 3 Rock:  500
1 each of Armor, Weapon, Aquatic, Fire, Verdant, and Rock:  1000
4 of a kind:  1000
5 of a kind:  1500
6 of a kind:  2000

Pressing the Bank Dice button will lock the selected dice (or dice that have been dragged into the banked dice area) into the banked dice area.  The total score of the banked dice will be added to the displayed Banked Score and the Bank Dice button will be disabled and the Roll button will be enabled.

Pressing the End Turn button will perform the following:
1. Check Banked Score.  If it is 0, increment Strikes by 1.  If Strikes is equal to 3 or greater, trigger the endgame.  If Banked Score is greater than 0, add the Banked Score to the overall Score, reset Banked Score to 0.
2. Decrement Turns Remaining by one.  If Turns Remaining equals 0, trigger the endgame.
3. Remove all dice from the Banked Dice area.
4. Ensure the Roll button is enabled and the Bank Dice button is disabled.


Endgame:
a. Pause for 2 seconds (without allowing further button presses) and then the game surface should be replaced with a notification that the player has completed the game and it should display the final Score value. It should also look up the highest min_score from the shoulders_rewards_lookup table that the player's score is equal to or greater than and get the rarity.  Then select a random row from the shoulders_lookup table of that rarity and display to the player that they have been rewarded with the name of that item (also display the image found in the image_url field).  A row should be added to the user_inventory table for that user and with that gear_id, "Shoulders", and false for is_equipped.
b. Update the user_gear_playcount table for row with the player's user_id and the gear_type of "Shoulders" by incrementing the today_play_count by one and incrementing the total_play_count by one.
c. If the final score is within the highest 10 scores for the "Shoulders" gear_type for this user in the user_top_gear_scores table, then insert a row into the table with this user_id, "Shoulders", current timestamp, and the round score.  Then delete any rows for this user and the "Shoulders" gear_type that have scores lower than their 10th highest. 
d. The game board should be removed.



Selecting the Rules button will display a popup with the following text:
"You begin with 8 turns to try and achieve the highest score possible.  Roll 6 dice to start your turn.  You must Bank at least 1 die to continue rolling.  You may End Turn at any time to add your Banked Score to your overall Score, or you may roll the remaining dice to continue.  But if you roll no scoring dice, your turn will end, you will not score, and you'll be given a strike.  3 strikes ends the game.  Good luck!

Scoring:
Armor:  50
Weapon:  100
3x Armor or 3x Weapon:  800
3x Aquatic or 3x Fire:  250
3x Verdant or 3x Rock:  500
1 each of Armor, Weapon, Aquatic, Fire, Verdant, and Rock:  1000
4 of a kind:  1000
5 of a kind:  1500
6 of a kind:  2000
"
