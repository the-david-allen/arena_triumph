The Belt page should be laid out with a "Play Game" button at the top left and a "Rules" button at the top right.


Selecting the Play Game button will begin a new game.  The belt game is based on nonogram where the player will be presented with an 12x12 grid.  

Grid creation:
A new 12x12 grid is randomly generated at the beginning of each game.  Each grid cell is either empty (false) or part of a run (true).  Runs can be either horizontal or verical and consist of a series of adjecent cells.  Ensure that at least 2 rows and at least 2 columns in the grid have a run length of 6 or more.  Beside each row of the grid are listed the lengths of the horizontal runs on that row (called the row hints). Above each column are listed the lengths of the vertical runs in that column (column hints).  At the beginning of a new game following the creation of a valid grid, the game must check to see if there is only a single unique grid configuration for the set of row hints and column hints.  If not, a new grid must be randomly generated.

For every cell in the grid that is adjacent to both a vertical run length of 1 and a horizontal run length of 1, place a belt icon (https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/belt.jpg) in that cell.

For each cell, the player can mark it dark green with a click or mark with an X (right click or click and hold). The player should be able to click and drag to mark more than one cell at a time.  Clicking a cell already marked in green or with an X should unmark the cell. Above the grid is a timer that begins at 0 seconds and starts counting the number of seconds the game has taken.  The player's goal is to find all dark green squares (in other words, to have correctly marked all the true cells with dark green without incorrectly marking any false cells) in the shortest time possible.


Once all the green squares have been correctly marked by the player, trigger the endgame.

Endgame:
a. Pause for 2 seconds (without allowing further button presses) and then the game surface should be replaced with a notification that the player has completed the game and it should display the number of seconds that it took them to complete the puzzle. It should also look up the lowest max_score from the belt_rewards_lookup table that the player's number of seconds is equal to or less than and get the rarity.  Then select a random row from the belt_lookup table of that rarity and display to the player that they have been rewarded with the name of that item (also display the image found in the image_url field).  A row should be added to the user_inventory table for that user and with that gear_id, "Belt", and false for is_equipped.
b. Update the user_gear_playcount table for row with the player's user_id and the gear_type of "Belt" by incrementing the today_play_count by one and incrementing the total_play_count by one.
c. If the final score is within the lowest 10 scores for the "Belt" gear_type for this user in the user_top_gear_scores table, then insert a row into the table with this user_id, "Belt", current timestamp, and the seconds score.  Then delete any rows for this user and the "Belt" gear_type that have scores greater than their 10th highest. 
d. The game board should be removed.



Selecting the Rules button will display a popup with the following text:
"You have a grid of squares, which must be either filled in black or marked with X. Beside each row of the grid are listed the lengths of the runs of black squares on that row. Above each column are listed the lengths of the runs of black squares in that column. Your aim is to find all black squares.

Left click on a square to make it black. Right click to mark with X. Click and drag to mark more than one square.  Good luck!"