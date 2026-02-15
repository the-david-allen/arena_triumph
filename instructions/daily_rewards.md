The Daily Rewards page should be laid out as the Obtain Gear page with 8 clickable tiles, one for each of the slot types.  Each tile should display the icon and the name for that slot.  

The Heading should say "Daily Rewards" and underneath should have the following text:  "Once you have completed 10 games for a gear slot, each day you can claim a free reward for that slot based on the average of your Top 10 scores".


For each slot/tile, look up the has_claimed_reward value for that gear_slot in the user_gear_playcount table.
If true, under the slot name in the tile, display "Daily Reward claimed." and make the tile unclickable.
Else, find the number of rows in the user_top_gear_scores table (table details found in schema.sql).
If the number of rows >= 10 then under the slot name in the tile, display an "Average of Top 10: X" label where X is the average of the score values found in the user_top_gear_scores for that gear_type followed by the score label (see Score Labels below) 
If the number of rows < 10 then under the slot name in the tile, display "Less than 10 top scores found" and make the tile unclickable.

When a tile is made unclickable, turn the tile a slight grey color to indicate that.

If a tile is clicked, do the following:
1. Display a Reward popup just as if the user had completed a game for that slot (Helm, Boots, Belt, Leggings, Shoulders, Chestpiece, Gauntlets, or Weapon) with the score of X and grant an item accordingly
2. Set the has_claimed_reward value for that gear_slot in the user_gear_playcount table to true. 


Score Labels:
Helm: points
Shoulders: points
Chest: points
Gauntlets: seconds
Leggings: guesses
Boots: seconds
Belt: seconds
Weapon: turns