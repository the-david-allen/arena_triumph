Upon loading the Battle page, several values need to be found and calculated.

Based on the tier of the battle, look up which boss is to be fought.  This can be found by querying the daily_boss_lineup table to find the boss_id for the given tier and then querying bosses_lookup to get that bosses information (name, image, attack strength, attack affinity, defense strength, defense affinity, and health).

Set the below values:
playerAttack:  Find the player's weapon (the item with gear_type = weapon in the user_inventory table with the value is_equipped = true).  Look up its strength value in the weapons_lookup table also get the primary_affinity and secondary_affinity as we will use these later.  Set playerAttack = the strength value.

Find the bosses defense affinity.  Then use the affinity_matchup_lookup table and look up the rows for the player's weapon's primary_affinity = affinity.
If the boss defense affinity matches one of the strong_against_affinity values for that weapon affinity, set playerAttack = 1.2 times playerAttack.

Now look up rows in the matchup table where the boss defense affinity = affinity.  If the weapon's primary_affinity matches one of the strong_against_affinity values for that boss defense affinity, set playerAttack = 0.8 times playerAttack.

Then use the affinity_matchup_lookup table and look up the rows for the player's weapon's secondary_affinity = affinity.
If the boss defense affinity matches one of the strong_against_affinity values for that weapon affinity, set playerAttack = 1.2 times playerAttack.

Now look up rows in the matchup table where the boss defense affinity = affinity.  If the weapon's secondary_affinity matches one of the strong_against_affinity values for that boss defense affinity, set playerAttack = 0.8 times playerAttack.

playerHealth:  Look up the player's level in the user_profiles table and set playerHealth = level + 9

numPlayerHits: set to -0.3 times (playerAttack minus boss defense strength) plus 12
If numPlayerHits < 2, set it to 2

playerSwingDamage:  set to boss health / numPlayerHits rounded to the nearest integer

playerDefense:  Starts at zero.  Then repeat the below steps for each of the 7 armor slot types (helm, chest, shoulders, gauntlets, belt, leggings, and boots).  Start with helm.  Initialize a slotPower integer to 0.

Find the player's helm (the item with gear_type = 'Helm' in the user_inventory table with the value is_equipped = true).  Look up its strength value in the helm_lookup table also get the primary_affinity and secondary_affinity as we will use these later.  Set slotPower = the helm's strength value.

Find the bosses attack affinity.  Then use the affinity_matchup_lookup table and look up the rows for the player's helm's primary_affinity = affinity.
If the boss attack affinity matches one of the strong_against_affinity values for that helm affinity, set slotPower = 1.2 times slotPower.

Now look up rows in the matchup table where the boss attack affinity = affinity.  If the helm's primary_affinity matches one of the strong_against_affinity values for that boss attack affinity, set slotPower = 0.8 times slotPower.

Then use the affinity_matchup_lookup table and look up the rows for the player's helm's secondary_affinity = affinity.
If the boss attack affinity matches one of the strong_against_affinity values for that helm affinity, set slotPower = 1.2 times slotPower.

Now look up rows in the matchup table where the boss attack affinity = affinity.  If the helm's secondary_affinity matches one of the strong_against_affinity values for that boss attack affinity, set slotPower = 0.8 times slotPower.

Increment playerDefense by slotPower.  Then reset slotPower to 0 and follow the same steps as for helm for the other armor slots (chest, shoulders, gauntlets, belt, leggings, and boots).

numBossHits: set = -0.3(boss attack strength - playerDefense) + 12
If numBossHits < 1, set it to 1.

bossSwingDamage: set to player health / numBossHits rounded up to the nearest integer


The Battle screen itself should begin with the Fight Status Display showing "Battle Begins in 5" and continue counting down 4, 3, 2, 1.  At this time, the user_daily_boss status table should be updated with has_fought = true for this user and the boss tier.

The Boss's image should be displayed in the boss image area and the player's image (user_image_url from the user_profiles table) should be displayed in the player image area.

Immediately to the right of the player's image is the player's health status bar.  It begins fully red with a value corresponding to the player's health.  As the player's health decreases, the red portion of the health bar should likewise decrease.

Above the player image is the Hit Bar with yellow zones and thinner green zones.

Immediately to the right of the boss's image is the boss's health status bar.  It begins fully red with a value corresponding to the boss's health.  As the boss's health decreases, the red portion of the health bar should likewise decrease.

The Debug Window should display the calculated values for playerAttack, numPlayerHits, playerSwingDamage, playerDefense, numBossHits, and bossSwingDamage.

Once the fight begins, either the player or the boss randomly goes first and they alternate from there.

Player's Turn:
After a random numer of milliseconds between 20 and 2000, a thick vertical line will appear at either the left or right (randomly determined) side of the hit bar.  The line will move horizontally towards the other end of the hit bar at a steady speed (it should take around 3 seconds to travel from one end to the other).  During this time, the Fight Status Display will read "Time Your Attacks in the green zone".  The player's goal is to click the mouse button (or touch on a mobile device) as the line is within the green zone and again once it reaches the second green zone.

Once the veritcal line reaches the opposite end of the hit bar, check the results as below:
If the player clicked once in each green zone (and did not give any extra clicks) the Fight Status display will read "Critical Hit!" and the boss's health will be decremented by (playerSwingDamage + 1).  

If the player clicked once in a green zone and once in a yellow zone, both times in yellow zones, or once in the green zone and once in the white zone, the Fight Status display will read "Successful Attack" and the boss's health will be decremented by playerSwingDamage.

If the player did not click while the vertical line was in a green zone and clicked one or less times while it was in a yellow zone, the fight status display will read "Clumsy attack" and the boss's health will be decremented by (playerSwingDamage - 1).

If the boss's health has reached <= 0 then the Fight Status display will read "Boss Defeated!  XP awarded".  The player will be awarded experience based on the tier of the boss.  In the user_profile table, the user's xp field will be incremented by 5 for defeating a boss of tier 1, 10 for defeating a boss of tier 2, 15 for defeating a boss of tier 3, and 20 for defeating a boss of tier 4. The fight ends and there are no more turns.


Boss's Turn:
The Fight Status Display will display the boss name followed by " Attacks!".  

After 500 milliseconds, determine the results of the attack.
10% of the time (randomly determined), the Fight Status Display should display the boss name and " scores a Critical Hit!"  The player's health is decremented by (bossSwingDamage + 1).

10% of the time (randomly determined), the Fight Status Display should display the boss name and " executes a Clumsy Attack!"  The player's health is decremented by (bossSwingDamage - 1).

The remaining 80% of the time, the Fight Status Display should display the boss name and " successfully attacks!"  The player's health is decremented by bossSwingDamage.

If the player's health has reached <=0 then the Fight Status display will wait 500 milliseconds and then show the boss name followed by " has defeated " followed by the player's username.  The fight ends and there are no more turns.