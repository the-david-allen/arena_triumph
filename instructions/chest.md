The Chestpiece page should be laid out as shown in images/chest_game_layout.jpeg 

There should be a "Play Game" button at the top left and a "Rules" button at the top right.

Selecting the Play Game button will begin a new game with the following flow:
- Query the chest_game_lookup table described in schema.sql.  Each row returned represents a card in a deck.
- Shuffle the deck of cards, remove 34 at random and represent the remaining deck in the Deck section of the layout.
- The player can click the deck to reveal the next card.  Each card should have a layout as shown in images/chest_game_card.jpeg with the following characteristics:
1. The background color of the card should match the color column from the table
2. A should be the value
3. B should be the slot_bonus
4. <slot> should be the slot
5. X should be the horizontal_bonus
6. Y should be the vertical bonus
-  When the player selects the Deck, the top card is revealed and the player can drag it to the discard pile or to any open slot remaining (Helm, either of the two Shoulders, Chestpiece, either of the two Gauntlets, Belt, either of the two Leggings, or either of the two Boots)
- When the player places the card in one of the open slots, the card Value is added to the Current Score, no mnore cards can be played in that slot, and several checks occur:
1. If all slots in that vertical line are filled, check to see if their cards' colors match.  If so, the thin vertical lines running through that vertical become highlighted and each of the cards' vertical_bonus is highlighted and those vertical_bonus valus are added to the Current Score.
2. If all slots in that horizontal line are filled, check to see if their cards' colors match.  If so, the thin horizontal lines running through that horizontal become highlighted and each of the cards' horizontal_bonus is highlighted and those horizontal_bonus valus are added to the Current Score.
3. If the slot element of the card matches the <slot> that it was placed into, the card becomes highlighted and it's slot_bonus is added to the Current Score.
4. If there are no remaining cards in the deck or all 11 slots of the layout (Helm, two Shoulders, Chestpiece, two Gauntlets, Belt, two Leggings, and two Boots) have cards played on them, the game is ended.  This triggers several actions:
a. Pause for 2 seconds and then the game surface should be replaced with a notification that the player has completed the game and it should display their Final Score (the value of current score at the end of the game). It should also look up the highest min_score from the chest_rewards_lookup table that the player's final score is equal to or greater than and get the rarity.  Then select a random row from the chest_lookup table of that rarity and display to the player that they have been rewarded with the name of that chestpiece (also display the image found in the image_url field).  A row should be added to the user_inventory table for that user and with that gear_id, "Chestpiece", and false for is_equipped.
b. Update the user_gear_playcount table for row with the player's user_id and the gear_type of "Chestpiece" by incrementing the today_play_count by one and incrementing the total_play_count by one.
c. If the final score is within the highest 10 scores for the "Chestpiece" gear_type for this user in the user_top_gear_scores table, then insert a row into the table with this user_id, "Chestpiece", current timestamp, and the score.  Then delete any rows for this user and the "Chestpiece" gear_type that have scores lower than their 10th highest. 
d. Current Score should be reset to 0.



Selecting the Rules button will display a popup with the following text:
"Click the top card of the deck to reveal the next card which you may play into a slot or drag to the Discard pile.  The game ends when all slots are filled or the deck is empty.

Each card has a value that will add to your score.  It also has several possible bonuses:
Slot Bonus: If you place the card into the corresponding slot, you receive this bonus.
Horizontal Bonus: If all slots in the row match in color, you recieve the horizontal bonus for each.
Vertical Bonus: If all slots in the row match in color, you recieve the vertical bonus for each.

The Deck contains 33 cards randomly selected from the full 67 card pool.  The pool contains:
 11 Purple (highest value)
 22 Green (medium value)
 33 White (lowest value)"