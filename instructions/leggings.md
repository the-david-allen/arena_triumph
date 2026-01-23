The Leggings page should be laid out as shown in Images/leggings_game_layout.jpeg

images found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/ 

There should be a "Play Game" button at the top left and a "Rules" button at the top right.



Selecting the Play Game button will begin a new game.  The game selects 5 random affinities (from the 10 total affinities, and it can include more than one of the same affinity) as the answer.  The player will submit guesses to try to guess which 5 affinities make up the answer in the correct order.  The game has the following flow:
- The game surface will contain a header with images of each of the 10 Affinities and a Strengths button that when pressed will bring up the Strengths screen which will contain a table with a row for each affinity and 2 columns labeled Strong Against: and Weak Against:  These columns will contain the information about which affinities are strong against which (and an affinity is weak against another affinity if the second affinity is strong against the first).  The affinity information can be found in the affinity_lookup table and the affinity_matchup_lookup table.
- The Round 1 row of 5 tiles will display with one of the tiles being highlighted.  To the right of the tiles will be a "Submit" button.  
- The Player will select one of the affinities (from the 10 affinity images in the header) and drag it or click it to the tile.  Once that happens, the tile will show the affinity image.  Once all 5 tiles have affinities assigned, the Player can submit the guess.
- Once clicked, if the guess exactly equals the answer, the endgame is triggered.  Otherwise, to the right of the Submit button, 4 clue rows will be displayed showing the number of exact matches, the number of misplaced matches, the number of affinities in the answer that are strong against the affinity guessed in the highlighted tile, and the number of affinities in the answer that are weak against the affinity guessed in the highlighted tile.
- Then a new Round row is added beneath the current one, with one random tile in that row being highlighted, and the next round begins.



Endgame:
a. Pause for 2 seconds (without allowing further button presses) and then the game surface should be replaced with a notification that the player has completed the game and it should display the number of Rounds that it took them to guess the answer. It should also look up the lowest max_score from the leggings_rewards_lookup table that the player's number of rounds is equal to or less than and get the rarity.  Then select a random row from the leggings_lookup table of that rarity and display to the player that they have been rewarded with the name of that item (also display the image found in the image_url field).  A row should be added to the user_inventory table for that user and with that gear_id, "Leggings", and false for is_equipped.
b. Update the user_gear_playcount table for row with the player's user_id and the gear_type of "Leggings" by incrementing the today_play_count by one and incrementing the total_play_count by one.
c. If the final score is within the lowest 10 scores for the "Leggings" gear_type for this user in the user_top_gear_scores table, then insert a row into the table with this user_id, "Leggings", current timestamp, and the round score.  Then delete any rows for this user and the "Leggings" gear_type that have scores greater than their 10th highest. 
d. The game board should be removed.



Selecting the Rules button will display a popup with the following text:
"A random set of 5 Affinities has been chosen as the answer.  Take a guess and learn how many affinities you guessed are an exact match and how many match but in the wrong location.

Each round, a random guess slot is highlighted and you will also learn which affinities in the answer are strong against or weak against the affinity guessed in that slot.

Try to guess in as few rounds as possible.  Good luck!"
