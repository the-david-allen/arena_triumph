The Gauntlets page should have a "Play Game" button at the top left and a "Rules" button at the top right.  The game screen layout should look like Images/tavern.png

Selecting the Play Game button will begin a new game.  The game screen is displayed with a countdown starting with 5, then 4, 3, 2, 1 and the game begins.  At the top left of the game screen is a timer that begins at 0 seconds and starts counting the number of seconds the game has taken. 

The game screen features four tables (also referred to as bars), each with a keg at the right end and a door at the left end (door not present in current image but will be added later). One patron at a time enters through a random one of the doors and slowly advances toward the kegs. The player controls the Tavernkeeper who must pour drinks and slide them down the bar for the patrons to catch. 

Variables:
mug_fill_time = 1.5 seconds
patron_slide_distance = 15% (of the game surface)

Player Controls:
* Pushing the up or down keys (or clicking on the bar above or below the current one) moves the tavernkeeper vertically to the keg at the next bar
* When a keg is selected, if the tavernkeeper is already beside that keg, he begins to fill up a mug there which takes mug_fill_time seconds to complete, during which the player cannot take any actions.  Once the mug is full, the Tavernkeeper slides the mug along the bar to the left.  If the tavernkeeper is not beside a keg that is selected, he moves up or down to the next bar in the direction of the keg selected.

Patrons slide patron_slide_distance back left toward the doors upon catching a full mug, and they disappear through the doors if their center goes far enough left to reach the midpoint of the door. If they complete their slide and are still to the right of a door's center, they stop for 1 second, and they resume their advance while sliding the empty mug back toward the keg.  The empty mug slides towards the keg side of the bar and once it reaches the right end of the bar, if the Tavernkeeper is there, the mug is caught and the mug disappears.  If the Tavernkeeper is at one of the other bars, the mug disappears, a crash sound is played and the player loses one life.

The player begins with 4 life represented by hearts at the top right of the game area. 

One life is lost when any of the following occurs:

    The player fails to catch an empty mug before it falls off the keg end of a bar.
    A full mug slides to the door end of a bar without being caught by a patron (at which point, a crash sound is played)
    Any patron reaches the keg end of a bar, at which point they disappear and a crash sound is played.

As the game progresses, the patrons appear more frequently, and move faster along the bar. In addition, the maximum number of patrons per bar gradually increases until every bar can have up to four patrons at a time. 


Once a player's final life is lost, trigger the endgame.  The players score is the number of seconds they lasted before the game ended.

Endgame:
a. Pause for 2 seconds (without allowing further button presses) and then the game surface should be replaced with a notification that the player has completed the game and it should display the number of seconds that it took them to complete the puzzle. It should also look up the highest min_score from the gauntlets_rewards_lookup table that the player's number of seconds is equal to or greater than and get the rarity.  Then select a random row from the gauntlets_lookup table of that rarity and display to the player that they have been rewarded with the name of that item (also display the image found in the image_url field).  A row should be added to the user_inventory table for that user and with that gear_id, "Gauntlets", and false for is_equipped.
b. Update the user_gear_playcount table for row with the player's user_id and the gear_type of "Gauntlets" by incrementing the today_play_count by one and incrementing the total_play_count by one.
c. If the final score is within the highest 10 scores for the "Gauntlets" gear_type for this user in the user_top_gear_scores table, then insert a row into the table with this user_id, "Gauntlets", current timestamp, and the seconds score.  Then delete any rows for this user and the "Gauntlets" gear_type that have scores less than their 10th highest. 
d. The game board should be removed.


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